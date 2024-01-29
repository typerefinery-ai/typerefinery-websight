package ai.typerefinery.websight.utils.git;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.InitCommand;
import org.eclipse.jgit.api.PullResult;
import org.eclipse.jgit.api.PushCommand;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.text.MessageFormat;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.locks.Lock;
import java.util.function.Function;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.eclipse.jgit.api.CloneCommand;
import org.eclipse.jgit.api.CreateBranchCommand;
import org.eclipse.jgit.api.FetchCommand;
import org.eclipse.jgit.api.MergeCommand;
import org.eclipse.jgit.api.MergeResult;
import org.eclipse.jgit.api.PullCommand;
import org.eclipse.jgit.api.PushCommand;
import org.eclipse.jgit.api.ResetCommand;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.JGitInternalException;
import org.eclipse.jgit.api.errors.RefAlreadyExistsException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.dircache.DirCache;
import org.eclipse.jgit.errors.CorruptObjectException;
import org.eclipse.jgit.errors.NoRemoteRepositoryException;
import org.eclipse.jgit.api.ListBranchCommand;
import org.eclipse.jgit.hooks.CommitMsgHook;
import org.eclipse.jgit.hooks.PreCommitHook;
import org.eclipse.jgit.hooks.PrePushHook;
import org.eclipse.jgit.internal.storage.file.LockFile;
import org.eclipse.jgit.lfs.BuiltinLFS;
import org.eclipse.jgit.lib.ConfigConstants;
import org.eclipse.jgit.lib.Constants;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.ObjectReader;
import org.eclipse.jgit.lib.PersonIdent;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.lib.RefUpdate;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.lib.RepositoryCache;
import org.eclipse.jgit.lib.StoredConfig;
import org.eclipse.jgit.merge.MergeMessageFormatter;
import org.eclipse.jgit.merge.MergeStrategy;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.CredentialsProvider;
import org.eclipse.jgit.transport.FetchResult;
import org.eclipse.jgit.transport.PushResult;
import org.eclipse.jgit.transport.RefSpec;
import org.eclipse.jgit.transport.RemoteRefUpdate;
import org.eclipse.jgit.transport.TagOpt;
import org.eclipse.jgit.transport.TrackingRefUpdate;
import org.eclipse.jgit.transport.URIish;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.treewalk.AbstractTreeIterator;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.util.FS;
import org.eclipse.jgit.util.LfsFactory;
import org.eclipse.jgit.util.io.NullOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class GitUtil {
    
    private static final Logger log = LoggerFactory.getLogger(GitUtil.class);

    public static void initializeGit(GitConfig gitConfig, boolean failOnError) {
        initializeGit(gitConfig, failOnError, false);
    }
    public static void initializeGit(GitConfig gitConfig, boolean failOnError, boolean forceInit) {
        if (gitConfig.git != null && gitConfig.localFolder != null) {
            return;
        }

        Lock writeLock = gitConfig.repositoryLock.writeLock();
        try {
            log.debug("initialize(): lock");
            writeLock.lock();

            if (StringUtils.isNotBlank(gitConfig.authUsername) && StringUtils.isNotBlank(gitConfig.authPassword)) {
                gitConfig.credentialsProvider = new NotResettableCredentialsProvider(gitConfig.authUsername,
                gitConfig.authPassword,
                gitConfig.localFolder.getName(),
                gitConfig.failedAuthenticationSeconds,
                gitConfig.maxAuthenticationAttempts);
            }

            if (StringUtils.isNotBlank(gitConfig.authToken)) {
                gitConfig.credentialsProvider = new NotResettableCredentialsProvider(gitConfig.authToken,
                "",
                gitConfig.localFolder.getName(),
                gitConfig.failedAuthenticationSeconds,
                gitConfig.maxAuthenticationAttempts);
            }

            // If LFS is enabled, we will use only built-in LFS.
            // BuiltinLFS.register(); //TODO: check if this is needed

            boolean clonedOrCreated = cloneOrInit(gitConfig, forceInit);

            gitConfig.git = Git.open(gitConfig.localFolder);
            updateGitConfigs(gitConfig);

            // Track all remote branches as local branches
            trackRemoteBranches(gitConfig.git);

            // Check if we should skip hooks.
            // detectCanRunHooks(gitConfig);

            if (!clonedOrCreated && gitConfig.uri != null) {
                try (Repository repository = Git.open(gitConfig.localFolder).getRepository()) {
                    configureBuiltInLFS(gitConfig, repository);

                    // initLfsCredentials(gitConfig);
                    FetchResult fetchResult = fetchAll(gitConfig);
                    doFastForward(gitConfig, fetchResult);
                    fastForwardNotMergedCommits(gitConfig, fetchResult);
                } finally {
                    resetLfsCredentials(gitConfig);
                }
            }

            if (gitConfig.credentialsProvider != null) {
                gitConfig.credentialsProvider.successAuthentication(GitActionType.INIT);
            }
            tryToUnlockIndex(gitConfig);
        } catch (Exception e) {
            if (gitConfig.git != null) {
                try {
                    gitConfig.git.close();
                } catch (Exception ignored) {
                }
                gitConfig.git = null;
            }
            if (failOnError) {
                throwClearException(gitConfig, e);
            } else {
                log.error(e.getMessage(), e);
            }
        } finally {
            writeLock.unlock();
            log.debug("initialize(): unlock");
        }
    }

    public static RevCommit createCommit(GitConfig gitConfig, String filePattern, String commitMessage) throws GitAPIException, IOException {
        
        gitConfig.git.add().addFilepattern(filePattern).call();
        return gitConfig.git.commit()
            .setMessage(formatComment(gitConfig, CommitType.SAVE, commitMessage))
            .setNoVerify(gitConfig.noVerify)
            .setCommitter(gitConfig.name, gitConfig.email)
            .call();
    }

    public static void push(GitConfig gitConfig) throws GitAPIException, IOException {
        if (gitConfig.uri == null) {
            return;
        }

        try {
            gitConfig.remoteRepoLock.lock();
            PushCommand push;

            if (gitConfig.git.getRepository().findRef(gitConfig.branch) != null) {
                push = gitConfig.git.push().setPushTags().add(gitConfig.branch).setTimeout(gitConfig.connectionTimeout);
            } else if (gitConfig.git.getRepository().findRef(gitConfig.baseBranch) == null) {
                gitConfig.git.getRepository().updateRef(gitConfig.baseBranch);
                gitConfig.git.branchCreate().setName(gitConfig.baseBranch).setForce(true).call();
                push = gitConfig.git.push().setPushTags().add(gitConfig.baseBranch).setTimeout(gitConfig.connectionTimeout);
            } else {
                throw new IOException(String.format("Cannot find branch '%s'", gitConfig.branch));
            }

            CredentialsProvider credentialsProvider = getCredentialsProvider(gitConfig, GitActionType.PUSH);
            if (credentialsProvider != null) {
                push.setCredentialsProvider(credentialsProvider);
            }

            Iterable<PushResult> results = push.call();
            successAuthentication(gitConfig, GitActionType.PUSH);
            validatePushResults(gitConfig, results);
        } finally {
            gitConfig.remoteRepoLock.unlock();
        }
    }

    private static void validatePushResults(GitConfig gitConfig, Iterable<PushResult> results) throws IOException {
        for (PushResult result : results) {
            log.debug(result.getMessages());

            Collection<RemoteRefUpdate> remoteUpdates = result.getRemoteUpdates();
            for (RemoteRefUpdate remoteUpdate : remoteUpdates) {
                RemoteRefUpdate.Status status = remoteUpdate.getStatus();
                switch (status) {
                    case OK:
                    case UP_TO_DATE:
                    case NON_EXISTING:
                        // Successful operation. Continue.
                        break;
                    case REJECTED_NONFASTFORWARD:
                        throw new IOException(
                            "Remote ref update was rejected, as it would cause non fast-forward update.");
                    case REJECTED_NODELETE:
                        throw new IOException(
                            "Remote ref update was rejected, because remote side does not support/allow deleting refs.");
                    case REJECTED_REMOTE_CHANGED:
                        throw new IOException(
                            "Remote ref update was rejected, because old object id on remote repository wasn't the same as defined expected old object.");
                    case REJECTED_OTHER_REASON:
                        String message = remoteUpdate.getMessage();
                        if ("pre-receive hook declined".equals(message)) {
                            message = "Remote git server rejected your commit because of pre-receive hook. Details:\n" + result
                                .getMessages();
                        }
                        throw new IOException(message);
                    case AWAITING_REPORT:
                        throw new IOException(
                            "Push process is awaiting update report from remote repository. This is a temporary state or state after critical error in push process.");
                    default:
                        throw new IOException(
                            "Push process returned with status " + status + " and message " + remoteUpdate
                                .getMessage());
                }
            }
        }
    }

    public static String formatComment(GitConfig gitConfig, CommitType commitType, String commitMessage) {
        if (gitConfig.escapedCommentTemplate == null) {
            return commitMessage;
        }
        return MessageFormat.format(gitConfig.escapedCommentTemplate, commitType, commitMessage);
    }


    private static void throwClearException(GitConfig gitConfig, Exception e) {
        Throwable cause = ExceptionUtils.getRootCause(e);
        if (cause == null) {
            cause = e;
        }

        // Unknown host
        if (cause instanceof UnknownHostException) {
            String error;
            final String message = cause.getMessage();
            if (message != null) {
                error = String.format("Unknown host (%s) for URL %s.", message, gitConfig.uri);
            } else {
                error = String.format("Unknown host for URL %s.", gitConfig.uri);
            }
            throw new IllegalArgumentException(error);
        } else if (cause instanceof NoRemoteRepositoryException) {
            throw new IllegalArgumentException(String.format("Remote repository \"%s\" does not exist.", gitConfig.uri));
        }

        if (e instanceof TransportException) {
            try {
                if ((new URIish(gitConfig.uri)).getScheme() == null) {
                    throw new IllegalStateException("Incorrect URL.");
                }
            } catch (URISyntaxException uriSyntaxException) {
                throw new IllegalStateException("Incorrect URL.");
            }
        }

        // Other cases
        throw new IllegalStateException("Failed to initialize a repository: " + e.getMessage(), e);
    }

    private static void tryToUnlockIndex(GitConfig gitConfig) {
        // try to unlock index if locked
        if (!LockFile.unlock(gitConfig.git.getRepository().getIndexFile())) {
            log.warn("Failed to unlock index for '{}' repository", gitConfig.localPath);
        }
    }

    
    public static FetchResult fetchAll(GitConfig gitConfig) throws GitAPIException {
        FetchCommand fetchCommand = gitConfig.git.fetch();
        fetchCommand.setTagOpt(TagOpt.FETCH_TAGS);
        CredentialsProvider credentialsProvider = getCredentialsProvider(gitConfig, GitActionType.FETCH_ALL);
        if (credentialsProvider != null) {
            fetchCommand.setCredentialsProvider(credentialsProvider);
        }
        fetchCommand.setRefSpecs(new RefSpec().setSourceDestination(Constants.R_HEADS + "*",
            Constants.R_REMOTES + Constants.DEFAULT_REMOTE_NAME + "/*"));
        fetchCommand.setRemoveDeletedRefs(true);
        fetchCommand.setTimeout(gitConfig.connectionTimeout);
        FetchResult result = fetchCommand.call();
        successAuthentication(gitConfig, GitActionType.FETCH_ALL);
        return result;
    }

    /**
     * @return true if need to force listener invocation. It can be if some branch was added or deleted.
     */
    private static boolean doFastForward(GitConfig gitConfig, FetchResult fetchResult) throws GitAPIException, IOException {
        boolean branchesChanged = false;
        for (TrackingRefUpdate refUpdate : fetchResult.getTrackingRefUpdates()) {
            RefUpdate.Result result = refUpdate.getResult();
            switch (result) {
                case FAST_FORWARD:
                    if (!isEmpty(gitConfig)) {
                        checkoutForced(gitConfig, refUpdate.getRemoteName());
                    }
                    if (!(Constants.R_HEADS + gitConfig.branch).equals(refUpdate.getRemoteName())) {
                        branchesChanged = true;
                    }
                    // It's assumed that we don't have unpushed commits at this point so there must be no additional
                    // merge
                    // while checking last revision. Accept only fast forwards.
                    gitConfig.git.merge()
                        .include(refUpdate.getNewObjectId())
                        .setFastForward(MergeCommand.FastForwardMode.FF_ONLY)
                        .call();
                    break;
                case REJECTED_CURRENT_BRANCH:
                    checkoutForced(gitConfig, gitConfig.branch); // On the next fetch the branch probably will be deleted
                    break;
                case FORCED:
                    if (ObjectId.zeroId().equals(refUpdate.getNewObjectId())) {
                        String remoteName = refUpdate.getRemoteName();
                        if (remoteName.startsWith(Constants.R_HEADS)) {
                            // Delete the branch
                            String branchToDelete = Repository.shortenRefName(remoteName);
                            String currentBranch = Repository.shortenRefName(gitConfig.git.getRepository().getFullBranch());
                            if (branchToDelete.equals(currentBranch)) {
                                String branchToCheckout = gitConfig.git.lsRemote()
                                    .setCredentialsProvider(getCredentialsProvider(gitConfig, GitActionType.FETCH_ALL))
                                    .callAsMap()
                                    .get("HEAD")
                                    .getObjectId()
                                    .getName();
                                checkoutForced(gitConfig, branchToCheckout);
                            }
                            gitConfig.git.branchDelete().setBranchNames(branchToDelete).setForce(true).call();
                            branchesChanged = true;
                        }
                    }
                    break;
                case NEW:
                    if (ObjectId.zeroId().equals(refUpdate.getOldObjectId())) {
                        String remoteName = refUpdate.getRemoteName();
                        if (remoteName.startsWith(Constants.R_HEADS)) {
                            createRemoteTrackingBranch(gitConfig.git, Repository.shortenRefName(remoteName));
                            branchesChanged = true;
                        }
                    }
                    break;
                case NO_CHANGE:
                    // Do nothing
                    break;
                default:
                    log.warn("Unsupported type of fetch result type: {}", result);
                    break;
            }
        }

        return branchesChanged;
    }

    private static boolean isEmpty(GitConfig gitConfig) throws IOException {
        Ref headRef = gitConfig.git.getRepository().exactRef(Constants.HEAD);
        return headRef == null || headRef.getObjectId() == null;
    }

    private static  void checkoutForced(GitConfig gitConfig, String branch) throws GitAPIException {
        gitConfig.git.checkout().setName(branch).setForced(true).call();
    }

    public static boolean isMergedInto(GitConfig gitConfig, String from, String to) throws IOException {
        initializeGit(gitConfig, true);

        Lock readLock = gitConfig.repositoryLock.readLock();
        try {
            log.debug("isMergedInto(): lock");
            readLock.lock();
            initLfsCredentials(gitConfig);
            Repository repository = gitConfig.git.getRepository();
            return isMergedInto(gitConfig, repository.resolve(from), repository.resolve(to), true);
        } finally {
            resetLfsCredentials(gitConfig);
            readLock.unlock();
            log.debug("isMergedInto(): unlock");
        }
    }

        /**
     * Checks if commit with id {@code fromId} is merged to commit with id {@code toId}.
     *
     * @param fromId origin
     * @param toId destination
     * @param skipEmptyChanges If false, it works as in git: Determine if a commit is reachable from another commit. If
     *            true, commits with empty changes will be skipped. In the latter case if there are no valuable changes
     *            in other branch (for example only merge commits gotten from our branch), this method returns true. If
     *            you are interested in all unmerged commits (including empty ones), use "false".
     * @return true if commit {@code fromId} is merged to commit with id {@code toId} and false otherwise.
     * @throws IOException if any error is occurred during this method
     */
    private static boolean isMergedInto(GitConfig gitConfig, ObjectId fromId, ObjectId toId, boolean skipEmptyChanges) throws IOException {
        Repository repository = gitConfig.git.getRepository();

        try (RevWalk revWalk = new RevWalk(repository)) {
            if (fromId == null || toId == null) {
                return false;
            }
            RevCommit fromCommit = revWalk.parseCommit(fromId);
            RevCommit toCommit = revWalk.parseCommit(toId);
            boolean merged = revWalk.isMergedInto(fromCommit, toCommit);
            if (!merged && skipEmptyChanges) {
                if (fromCommit.getParentCount() == 2) {
                    // fromCommit is a merge commit
                    final RevCommit parent1 = fromCommit.getParent(0);
                    final RevCommit parent2 = fromCommit.getParent(1);

                    if (hasSameContent(gitConfig, parent1, fromCommit) || hasSameContent(gitConfig, parent2, fromCommit)) {
                        // Merge commit has same content as one of their parents
                        final boolean firstParentMerged = isMergedInto(gitConfig, parent1, toCommit, true);
                        final boolean secondParentMerged = isMergedInto(gitConfig, parent2, toCommit, true);
                        if (firstParentMerged && secondParentMerged) {
                            // If both parents are merged to our commit and one of the parents is same as child (merge
                            // commit), we can assume that the merge commit doesn't have any valuable updates.
                            // So we can assume that all valuable changes are merged.
                            return true;
                        }
                    }
                }
            }
            return merged;
        } catch (IOException e) {
            throw e;
        } catch (Exception e) {
            throw new IOException(e.getMessage(), e);
        }
    }

    private static boolean hasSameContent(GitConfig gitConfig, RevCommit commit1, RevCommit commit2) throws IOException {
        try (DiffFormatter diffFormatter = new DiffFormatter(NullOutputStream.INSTANCE)) {
            diffFormatter.setRepository(gitConfig.git.getRepository());
            List<DiffEntry> diffEntries = diffFormatter.scan(commit1, commit2);
            if (diffEntries.isEmpty()) {
                return true;
            }
        }
        return false;
    }

    private static void fastForwardNotMergedCommits(GitConfig gitConfig, FetchResult fetchResult) throws IOException, GitAPIException {
        // Support the case when for some reason commits were fetched but not merged to current branch earlier.
        // In this case fetchResult.getTrackingRefUpdates() can be empty.
        // If everything is merged into current branch, this method does nothing.
        // Obviously this method is not needed. It's invoked only to fix unexpected errors during work with repository.
        Ref advertisedRef = fetchResult.getAdvertisedRef(Constants.R_HEADS + gitConfig.branch);
        Ref localRef = gitConfig.git.getRepository().findRef(gitConfig.branch);
        if (localRef != null && advertisedRef != null && !localRef.getObjectId().equals(advertisedRef.getObjectId())) {
            if (isMergedInto(gitConfig, advertisedRef.getObjectId(), localRef.getObjectId(), false)) {
                // We enter here only if we have inconsistent repository state. Need additional investigation if this
                // occurred. For example this can happen if we discarded locally some commit but the branch didn't move
                // to the desired new HEAD.
                log.warn(
                    "Advertised commit is already merged into current head in branch '{}'. Current HEAD: {}, advertised ref: {}",
                    gitConfig.branch,
                    localRef.getObjectId().name(),
                    advertisedRef.getObjectId().name());
            } else {
                // Typically this shouldn't occur. But if found such case, should fast-forward local repository and
                // write
                // warning for future investigation.
                log.warn(
                    "Found commits that are not fast forwarded in branch '{}'. Current HEAD: {}, advertised ref: {}",
                    gitConfig.branch,
                    localRef.getObjectId().name(),
                    advertisedRef.getObjectId().name());
                checkoutForced(gitConfig, gitConfig.branch);
                gitConfig.git.merge().include(advertisedRef).setFastForward(MergeCommand.FastForwardMode.FF_ONLY).call();
            }
        }
    }

    public static void pull(GitConfig gitConfig, String commitToRevert) throws GitAPIException, IOException {
        if (gitConfig.uri == null) {
            return;
        }

        FetchResult fetchResult;
        try {
            gitConfig.remoteRepoLock.lock();
            fetchResult = fetchAll(gitConfig);
        } finally {
            gitConfig.remoteRepoLock.unlock();
        }

        try {
            Ref r = fetchResult.getAdvertisedRef(gitConfig.branch);
            if (r == null) {
                r = fetchResult.getAdvertisedRef(Constants.R_HEADS + gitConfig.branch);
            }
            if (r == null) {
                r = gitConfig.git.getRepository().findRef(gitConfig.branch);
            }

            if (r == null) {
                return;
            }

            String mergeMessage = getMergeMessage(gitConfig, r);
            MergeResult mergeResult = gitConfig.git.merge()
                .include(r.getObjectId())
                .setStrategy(MergeStrategy.RECURSIVE)
                .setMessage(mergeMessage)
                .setCommit(false)
                .call();

            // validateNonConflictingMerge(gitConfig, mergeResult);
            // validateMergeConflict(gitConfig, mergeResult, true, gitConfig.branch, gitConfig.name);

            applyMergeCommit(gitConfig, mergeResult, mergeMessage);

        } catch (GitAPIException | IOException e) {
            reset(gitConfig, commitToRevert);
            throw e;
        } finally {
            try {
                doFastForward(gitConfig, fetchResult);
            } catch (Exception e) {
                // Don't override exception thrown in catch block.
                log.error(e.getMessage(), e);
            }
        }
    }
        /**
     * Reset work dir and index.
     */
    private void reset(GitConfig gitConfig) {
        reset(gitConfig, null);
    }

    /**
     * Reset work dir, index and discard commit. if {@code commitToDiscard} is null, then just reset work dir and index.
     *
     * @param commitToDiscard if null, commit will not be discarded. If not null, commit with that id will be discarded.
     */
    private static void reset(GitConfig gitConfig, String commitToDiscard) {
        try {
            String fullBranch = gitConfig.git.getRepository().getFullBranch();
            if (ObjectId.isId(fullBranch)) {
                // Detached HEAD. Just checkout to current branch and reset working dir.
                log.debug("Found detached HEAD: {}.", fullBranch);
                gitConfig.git.checkout().setName(gitConfig.branch).setForced(true).call();
            } else {
                ResetCommand resetCommand = gitConfig.git.reset().setMode(ResetCommand.ResetType.HARD);
                // If commit is not merged to our branch, it's detached - in this case no need to reset commit tree.
                if (commitToDiscard != null && isCommitMerged(gitConfig, commitToDiscard)) {
                    log.debug("Discard commit: {}.", commitToDiscard);
                    resetCommand.setRef(commitToDiscard + "^");
                }
                try {
                    resetCommand.call();
                } catch (JGitInternalException e) {
                    // check if index file is corrupted
                    File indexFile = gitConfig.git.getRepository().getIndexFile();
                    try {
                        DirCache dc = new DirCache(indexFile, gitConfig.git.getRepository().getFS());
                        dc.read();
                        log.error(e.getMessage(), e);
                    } catch (CorruptObjectException ex) {
                        log.error("git index file is corrupted and will be deleted", e);
                        if (!indexFile.delete() && indexFile.exists()) {
                            log.warn("Cannot delete corrupted index file {}.", indexFile);
                        }
                        resetCommand.call();
                    }
                }
            }
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
    }

    private static boolean isCommitMerged(GitConfig gitConfig, String commitId) throws IOException {
        Repository repository = gitConfig.git.getRepository();
        try (RevWalk revWalk = new RevWalk(repository)) {
            RevCommit branchHead = revWalk.parseCommit(repository.resolve(Constants.R_HEADS + gitConfig.branch));
            RevCommit otherHead = revWalk.parseCommit(repository.resolve(commitId));
            return revWalk.isMergedInto(otherHead, branchHead);
        }
    }

    static String getVersionName(GitConfig gitConfig, Repository repository, List<Ref> tags, ObjectId commitId) throws IOException {
        Ref tagRef = getTagRefForCommit(gitConfig, repository, tags, commitId);

        return tagRef != null ? getLocalTagName(gitConfig, tagRef) : commitId.getName();
    }

    private static Ref getTagRefForCommit(GitConfig gitConfig, Repository repository, List<Ref> tags, ObjectId commitId) throws IOException {
        Ref tagRefForCommit = null;
        for (Ref tagRef : tags) {
            ObjectId objectId = repository.getRefDatabase().peel(tagRef).getPeeledObjectId();
            if (objectId == null) {
                objectId = tagRef.getObjectId();
            }

            if (objectId.equals(commitId)) {
                tagRefForCommit = tagRef;
                break;
            }
        }
        return tagRefForCommit;
    }

    private static String getLocalTagName(GitConfig gitConfig, Ref tagRef) {
        String name = tagRef.getName();
        return name.startsWith(Constants.R_TAGS) ? name.substring(Constants.R_TAGS.length()) : name;
    }

    private void addTagToCommit(GitConfig gitConfig, RevCommit commit) throws GitAPIException, IOException {
        addTagToCommit(gitConfig, commit, commit.getId().getName());
    }

    private void addTagToCommit(GitConfig gitConfig, RevCommit commit, String commitToRevert) throws GitAPIException,
                                                                                               IOException {
        pull(gitConfig, commitToRevert);

        if (!gitConfig.tagPrefix.isEmpty()) {
            String tagName = gitConfig.tagPrefix + getNextTagId(gitConfig);
            gitConfig.git.tag().setObjectId(commit).setName(tagName).call();
        }
    }

    private String getNextTagId(GitConfig gitConfig) throws GitAPIException {
        List<Ref> call = gitConfig.git.tagList().call();
        long maxId = 0;
        for (Ref tagRef : call) {
            String name = getLocalTagName(gitConfig, tagRef);
            if (name.startsWith(gitConfig.tagPrefix)) {
                int num;
                try {
                    num = Integer.parseInt(name.substring(gitConfig.tagPrefix.length()));
                } catch (NumberFormatException e) {
                    log.debug("Tag '{}' is skipped because it does not contain version number", name);
                    continue;
                }
                if (num > maxId) {
                    maxId = num;
                }
            }
        }

        return String.valueOf(maxId + 1);
    }
    
    private static void applyMergeCommit(GitConfig gitConfig, MergeResult mergeResult, String mergeMessage) throws GitAPIException {
        if (mergeResult.getMergeStatus().equals(MergeResult.MergeStatus.MERGED_NOT_COMMITTED)) {
            gitConfig.git.commit()
                .setMessage(mergeMessage)
                .setNoVerify(gitConfig.noVerify)
                .setCommitter(gitConfig.name, gitConfig.email)
                .call();
        }
    }
    private static AbstractTreeIterator prepareTreeParser(Repository repository, ObjectId objectId) throws IOException {
        // from the commit we can build the tree which allows us to construct the TreeParser
        // noinspection Duplicates
        try (RevWalk walk = new RevWalk(repository)) {
            RevCommit commit = walk.parseCommit(objectId);
            RevTree tree = walk.parseTree(commit.getTree().getId());

            CanonicalTreeParser treeParser = new CanonicalTreeParser();
            try (ObjectReader reader = repository.newObjectReader()) {
                treeParser.reset(reader, tree.getId());
            }

            walk.dispose();

            return treeParser;
        }
    }

    private String escapeCurlyBrackets(String value) {
        String ret = value.replaceAll("\\{(?![012]})", "'{'");
        return ret.replaceAll("(?<!\\{[012])}", "'}'");
    }

    public void setCommentTemplate(GitConfig gitConfig, String commentTemplate) {
        gitConfig.commentTemplate = commentTemplate;
        String ct = commentTemplate.replace("{commit-type}", "{0}").replace("{user-message}", "{1}");
        gitConfig.escapedCommentTemplate = escapeCurlyBrackets(ct);
        gitConfig.commitMessageParser = new CommitMessageParser(commentTemplate);
    }


    private static String getMergeMessage(GitConfig gitConfig, Ref r) throws IOException {
        String userMessage = new MergeMessageFormatter().format(Collections.singletonList(r),
        gitConfig.git.getRepository().exactRef(Constants.HEAD));
        if (gitConfig.escapedCommentTemplate == null) {
            return userMessage;
        }
        return MessageFormat.format(gitConfig.escapedCommentTemplate, CommitType.MERGE, userMessage);
    }


    private static void initLfsCredentials(GitConfig gitConfig) {
        if (gitConfig.credentialsProvider != null && gitConfig.useLFS) {
            // TODO: check if this is still needed, should be using HTTPS credentials
            // LfsFactory.setCredentialsProvider((CredentialsProvider)gitConfig.credentialsProvider);
        }
    }

    private static void resetLfsCredentials(GitConfig gitConfig) {
        if (gitConfig.credentialsProvider != null && gitConfig.useLFS) {
            // TODO: check if this is still needed, should be using HTTPS credentials
            // LfsFactory.removeCredentialsProvider();
        }
    }

    public static boolean cloneOrInit(GitConfig gitConfig) throws IOException, GitAPIException {
        return cloneOrInit(gitConfig, false);
    }
    public static boolean cloneOrInit(GitConfig gitConfig, Boolean forceInit) throws IOException, GitAPIException {
        boolean shouldCloneOrInit;
        boolean shouldUpdateOrigin = false;
        if (!gitConfig.localFolder.exists()) {
            shouldCloneOrInit = true;
        } else {
            if (!gitConfig.localFolder.isDirectory()) {
                throw new IOException(String.format("'%s' is not a directory.", gitConfig.localFolder));
            }

            File[] files = gitConfig.localFolder.listFiles();

            if (files.length > 0) {
                // is git already initialized?
                if (RepositoryCache.FileKey.resolve(gitConfig.localFolder, FS.DETECTED) != null) {
                    log.debug("Reuse existing git repository {}", gitConfig.localFolder);
                    try (Repository repository = Git.open(gitConfig.localFolder).getRepository()) {
                        if (gitConfig.uri != null) {
                            String remoteUrl = repository.getConfig()
                                .getString(ConfigConstants.CONFIG_REMOTE_SECTION,
                                    Constants.DEFAULT_REMOTE_NAME,
                                    ConfigConstants.CONFIG_KEY_URL);
                            if (!gitConfig.uri.equals(remoteUrl)) {
                                URI proposedUri = getUri(gitConfig.uri);
                                URI savedUri = getUri(remoteUrl);
                                if (!proposedUri.equals(savedUri)) {
                                    if (savedUri != null && isSame(proposedUri, savedUri)) {
                                        shouldUpdateOrigin = true;
                                    } else {
                                        throw new IOException(String.format(
                                            "Folder '%s' already contains gitConfig.localFolder git repository, but is configured to different URI (%s).\nDelete it or choose another gitConfig.localFolder path or set correct URL for repository.",
                                            gitConfig.localFolder,
                                            remoteUrl));
                                    }
                                }
                            }
                        }
                    }
                    shouldCloneOrInit = false;
                } else {
                    if (forceInit) {
                        //init new repo
                        Git repo = Git.init()
                            .setDirectory(gitConfig.localFolder)
                            .call();

                        try {
                            repo.remoteAdd()
                                .setName(Constants.DEFAULT_REMOTE_NAME)
                                .setUri(new URIish(gitConfig.uri))                                
                                .call();
                        } catch (URISyntaxException e) {
                            // TODO Auto-generated catch block
                            e.printStackTrace();
                            log.debug("Could not add remote {}", gitConfig.uri);
                        }
                        try {
                            repo.branchCreate()
                                .setName(gitConfig.branch)
                                .call();
                        } catch (Exception e) {
                            // TODO Auto-generated catch block
                            e.printStackTrace();
                            log.debug("Could not create branch {}", gitConfig.branch);
                        }
                        repo.close();
                        return true;
                    } else {
                        // Cannot overwrite existing files that is definitely not git repository
                        throw new IOException(String.format(
                            "Folder '%s' already exists and is not a git repository. Use another gitConfig.localFolder path or delete the existing folder to create a git repository.",
                            gitConfig.localFolder));
                    }
                }
            } else {
                shouldCloneOrInit = true;
            }
        }

        if (shouldCloneOrInit) {
            try {
                //clone repo
                if (gitConfig.uri != null) {
                    CloneCommand cloneCommand = Git.cloneRepository()
                        .setURI(gitConfig.uri)
                        .setDirectory(gitConfig.localFolder)
                        .setBranch(gitConfig.branch)
                        .setNoCheckout(true)
                        .setCloneAllBranches(true);

                    CredentialsProvider credentialsProvider = getCredentialsProvider(gitConfig, GitActionType.CLONE);
                    if (credentialsProvider != null) {
                        cloneCommand.setCredentialsProvider(credentialsProvider);
                    }

                    Git cloned = cloneCommand.call();
                    successAuthentication(gitConfig, GitActionType.CLONE);

                    // After cloning without checkout we don't have HEAD and gitConfig.localFolder gitConfig.branches. Need to create them.
                    trackRemoteBranches(cloned);

                    // Detect if our repository needs to use built-in LFS.
                    configureBuiltInLFS(gitConfig, cloned.getRepository());

                    try {
                        // Checkout after clone with LFS enabled.
                        initLfsCredentials(gitConfig);
                        cloned.checkout().setName(gitConfig.branch).setForced(true).call();
                    } finally {
                        resetLfsCredentials(gitConfig);
                    }

                    cloned.close();
                } else {
                    //init new repo
                    Git repo = Git.init().setDirectory(gitConfig.localFolder).call();
                    repo.close();
                }
            } catch (Exception e) {
                deleteQuietly(gitConfig.localFolder);
                throw e;
            } finally {
                resetLfsCredentials(gitConfig);
            }
        } else if (shouldUpdateOrigin) {
            try (Repository repository = Git.open(gitConfig.localFolder).getRepository()) {
                StoredConfig config = repository.getConfig();
                config.setString(ConfigConstants.CONFIG_REMOTE_SECTION,
                    Constants.DEFAULT_REMOTE_NAME,
                    ConfigConstants.CONFIG_KEY_URL,
                    gitConfig.uri);
                config.save();
            }
        }
        return shouldCloneOrInit;
    }

    private void detectCanRunHooks(GitConfig gitConfig) {
        gitConfig.noVerify = false;
        File hookDir = new File(gitConfig.git.getRepository().getDirectory(), Constants.HOOKS);
        File preCommitHook = new File(hookDir, PreCommitHook.NAME);
        File commitMsgHook = new File(hookDir, CommitMsgHook.NAME);
        if (!preCommitHook.isFile() && !commitMsgHook.isFile()) {
            log.debug("Hooks are absent");
            gitConfig.noVerify = true;
        } else {
            try {
                if (!Files.isExecutable(preCommitHook.toPath()) || !Files.isExecutable(commitMsgHook.toPath())) {
                    log.debug("Hook exists but not executable");
                    gitConfig.noVerify = true;
                }
            } catch (SecurityException e) {
                log.warn("Hook exists but there is no access to invoke the file.", e);
                gitConfig.noVerify = true;
            }
        }
    }

    private static void updateGitConfigs(GitConfig gitConfig) throws IOException {
        StoredConfig config = gitConfig.git.getRepository().getConfig();
        
        config.setString(ConfigConstants.CONFIG_CORE_SECTION,
            null,
            ConfigConstants.CONFIG_KEY_EOL,
            "lf");

        config.setBoolean(ConfigConstants.CONFIG_USER_SECTION,
            null,
            ConfigConstants.CONFIG_KEY_AUTOCRLF,
            false);
            
        config.setBoolean(ConfigConstants.CONFIG_USER_SECTION,
            null,
            "longpaths",
            true);

        if (StringUtils.isNotBlank(gitConfig.email)) {
            config.setString(ConfigConstants.CONFIG_USER_SECTION,
                null,
                ConfigConstants.CONFIG_KEY_EMAIL,
                gitConfig.email);
        }
        if (StringUtils.isNotBlank(gitConfig.name)) {
            config.setString(ConfigConstants.CONFIG_USER_SECTION,
                null,
                ConfigConstants.CONFIG_KEY_NAME,
                gitConfig.name);
        }
        if (gitConfig.noVerify) {
            config.setBoolean(ConfigConstants.CONFIG_COMMIT_SECTION,
                null,
                ConfigConstants.CONFIG_KEY_GPGSIGN,
                false);
        }
        if (gitConfig.gcAutoDetach != null) {
            config.setBoolean(ConfigConstants.CONFIG_GC_SECTION,
                null,
                ConfigConstants.CONFIG_KEY_AUTODETACH,
                gitConfig.gcAutoDetach);
        }

        config.save();
    }

    private static URI getUri(String uriOrPath) {
        if (uriOrPath == null) {
            return null;
        }
        try {
            return new URL(uriOrPath).toURI();
        } catch (URISyntaxException | MalformedURLException e) {
            // uri can be a folder path. It's not valid URI but git accepts paths too.
            return new File(uriOrPath).toURI();
        }
    }

    private static NotResettableCredentialsProvider getCredentialsProvider(GitConfig gitConfig, GitActionType actionType) {
        if (gitConfig.credentialsProvider != null) {
            gitConfig.credentialsProvider.validateAuthorizationState(actionType);
        }
        return gitConfig.credentialsProvider;
    }

    private static void successAuthentication(GitConfig gitConfig, GitActionType actionType) {
        if (gitConfig.credentialsProvider != null) {
            gitConfig.credentialsProvider.successAuthentication(actionType);
        }
    }

    private static void trackRemoteBranches(Git git) throws GitAPIException {
        List<Ref> remoteBranches = git.branchList().setListMode(ListBranchCommand.ListMode.REMOTE).call();
        TreeSet<String> localBranches = getAvailableBranches(git);
        String remotePrefix = Constants.R_REMOTES + Constants.DEFAULT_REMOTE_NAME + "/";
        for (Ref remoteBranch : remoteBranches) {
            if (remoteBranch.isSymbolic()) {
                log.debug("Skip the symbolic branch '{}'.", remoteBranch.getName());
                continue;
            }
            if (!remoteBranch.getName().startsWith(remotePrefix)) {
                log.warn("The branch {} will not be tracked", remoteBranch.getName());
                continue;
            }
            String branchName = remoteBranch.getName().substring(remotePrefix.length());
            try {
                if (!localBranches.contains(branchName)) {
                    createRemoteTrackingBranch(git, branchName);
                }
            } catch (RefAlreadyExistsException e) {
                // the error may appear on non-case sensitive OS
                log.warn(
                    "The branch '{}' will not be tracked because a branch with the same name already exists. Branches with the same name, but different capitalization do not work on non-case sensitive OS.",
                    remoteBranch.getName());
            }
        }
    }

    private static TreeSet<String> getAvailableBranches(GitConfig gitConfig) throws GitAPIException {
        return getAvailableBranches(gitConfig.git);
    }

    private static TreeSet<String> getAvailableBranches(Git git) throws GitAPIException {
        TreeSet<String> branchNames = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);

        List<Ref> refs = git.branchList().call();
        for (Ref ref : refs) {
            String name = ref.getName();
            if (name.startsWith(Constants.R_HEADS)) {
                name = name.substring(Constants.R_HEADS.length());
                branchNames.add(name);
            }
        }
        return branchNames;
    }

    private static void createRemoteTrackingBranch(Git git, String branch) throws GitAPIException {
        git.branchCreate()
            .setName(branch)
            .setUpstreamMode(CreateBranchCommand.SetupUpstreamMode.TRACK)
            .setStartPoint(Constants.DEFAULT_REMOTE_NAME + "/" + branch)
            .call();
    }

    private static void configureBuiltInLFS(GitConfig gitConfig, Repository repository) throws IOException {
        boolean lfsApplied = false;

        try (RevWalk walk = new RevWalk(repository)) {
            ObjectId branchId = null;
            if (repository.findRef(gitConfig.branch) != null) {
                branchId = repository.resolve(gitConfig.branch);
            }
            if (branchId != null) {
                RevCommit commit = walk.parseCommit(branchId);

                try (TreeWalk rootWalk = buildTreeWalk(repository, Constants.DOT_GIT_ATTRIBUTES, commit.getTree())) {
                    ObjectLoader loader = repository.open(rootWalk.getObjectId(0));
                    lfsApplied = new String(loader.getBytes(), StandardCharsets.UTF_8).contains("filter=lfs");
                } catch (FileNotFoundException ignored) {
                }
            }
        }

        gitConfig.useLFS = lfsApplied;

        if (gitConfig.useLFS) {
            log.info("LFS is enabled for repository '{}'.", gitConfig.localPath);
            try {
                boolean installed = repository.getConfig()
                    .getBoolean(ConfigConstants.CONFIG_FILTER_SECTION,
                        ConfigConstants.CONFIG_SECTION_LFS,
                        ConfigConstants.CONFIG_KEY_USEJGITBUILTIN,
                        false);
                if (!installed) {
                    LfsFactory.getInstance().getInstallCommand().setRepository(repository).call();
                }
            } catch (IOException e) {
                throw e;
            } catch (Exception e) {
                throw new IOException(e);
            }

            File hookFile = repository.getFS().findHook(repository, PrePushHook.NAME);
            if (hookFile != null) {
                try (var input = new FileInputStream(hookFile)) {
                    var content = new String(input.readAllBytes(), StandardCharsets.UTF_8);
                    if (content.contains("git lfs")) {
                        // Rename pre-push hook otherwise we will be spammed with warning message (if native git with
                        // LFS is found)
                        log.info(
                            "Rename pre-push hook to avoid conflict between LFS built-in hook and existing pre-push hook. Repo: {}",
                            repository);
                        String from = hookFile.getPath();
                        String to = from + ".renamed";
                        boolean renamed = hookFile.renameTo(new File(to));
                        if (!renamed) {
                            log.warn("Cannot rename '{}' to '{}'", from, to);
                        }
                    }
                }
            }
        }
    }

    private static TreeWalk buildTreeWalk(Repository repository, String path, RevTree tree) throws IOException {
        TreeWalk treeWalk;
        if (StringUtils.isEmpty(path)) {
            treeWalk = new TreeWalk(repository);
            treeWalk.addTree(tree);
            treeWalk.setRecursive(true);
            treeWalk.setPostOrderTraversal(false);
        } else {
            treeWalk = TreeWalk.forPath(repository, path, tree);
        }

        if (treeWalk == null) {
            throw new FileNotFoundException(
                String.format("Missed expected path '%s' in tree '%s'.", path, tree.getName()));
        }
        return treeWalk;
    }
    
    static boolean isSame(URI a, URI b) {
        if (!Objects.equals(a.getRawFragment(), b.getRawFragment())) {
            return false;
        }
        Function<String, String> remLastSlash = s -> {
            int i = s.length();
            while (i > 0 && s.charAt(i - 1) == '/') {
                i--;
            }
            if (i != s.length() && s.charAt(i) == '/') {
                return s.substring(0, i);
            } else {
                return s;
            }
        };
        if (!Objects.equals(a.getRawSchemeSpecificPart(), b.getRawSchemeSpecificPart())) {
            if (!Objects.equals(remLastSlash.apply(a.getRawSchemeSpecificPart()),
                remLastSlash.apply(b.getRawSchemeSpecificPart()))) {
                return false;
            }
        }
        if (!Objects.equals(a.getRawPath(), b.getRawPath())) {
            if (!Objects.equals(remLastSlash.apply(a.getRawPath()), remLastSlash.apply(b.getRawPath()))) {
                return false;
            }
        }
        if (!Objects.equals(a.getRawQuery(), b.getRawQuery())) {
            return false;
        }
        if (!Objects.equals(a.getRawAuthority(), b.getRawAuthority())) {
            return false;
        }
        if (a.getHost() != null) {
            if (!Objects.equals(a.getRawUserInfo(), b.getRawUserInfo())) {
                return false;
            }
            if (!a.getHost().equalsIgnoreCase(b.getHost())) {
                return false;
            }
            if (a.getPort() != b.getPort()) {
                return false;
            }
        }
        return Objects.equals(a.getRawAuthority(), b.getRawAuthority());
    }

        /**
     * Deletes a file, never throwing an exception. If file is a directory, delete it and all sub-directories.
     * <p/>
     * The difference between File.delete() and this method are:
     * <ul>
     * <li>A directory to be deleted does not have to be empty.</li>
     * <li>No exceptions are thrown when a file or directory cannot be deleted.</li>
     * </ul>
     *
     * @param file file or directory to delete, can be {@code null}
     */
    public static void deleteQuietly(File file) {
        if (file == null) {
            return;
        }
        try {
            delete(file);
        } catch (Exception ignored) {
            // ignore
        }
    }

    public static void deleteQuietly(Path path) {
        if (path == null) {
            return;
        }
        try {
            delete(path);
        } catch (Exception ignored) {
            // ignore
        }
    }

    /**
     * Deletes a path. If provided path is a directory, delete it and all sub-directories.
     *
     * @param root path to file or directory to delete, must not be {@code null}
     * @throws NullPointerException if the directory is {@code null}
     * @throws FileNotFoundException if the file has not been found
     * @throws IOException in case deletion is unsuccessful
     */
    public static void delete(Path root) throws IOException {
        if (!Files.exists(root)) {
            throw new FileNotFoundException("Path does not exist: " + root);
        }
        Files.walkFileTree(root, new SimpleFileVisitor<>() {
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                delete0(file);
                return FileVisitResult.CONTINUE;
            }

            public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                delete0(dir);
                return FileVisitResult.CONTINUE;
            }
        });
    }
    
        /**
     * Delete file or directory using old API. Because {@link Files#delete(Path)} throws sometimes
     * {@link java.nio.file.AccessDeniedException} by unknown reason on Windows environment
     *
     * @param path path to delete
     * @throws IOException if failed to delete
     */
    private static void delete0(Path path) throws IOException {
        File toDelete = path.toFile();
        if (!toDelete.delete()) {
            throw new IOException("Failed to delete: " + path);
        }
    }
    
    /**
     * Deletes a file. If file is a directory, delete it and all sub-directories.
     * <p/>
     * The difference between File.delete() and this method are:
     * <ul>
     * <li>A directory to be deleted does not have to be empty.</li>
     * <li>You get exceptions when a file or directory cannot be deleted.</li>
     * </ul>
     *
     * @param file file or directory to delete, must not be {@code null}
     * @throws NullPointerException if the directory is {@code null}
     * @throws FileNotFoundException if the file has not been found
     * @throws IOException in case deletion is unsuccessful
     */
    public static void delete(File file) throws IOException {
        if (file.isDirectory()) {
            File[] files = file.listFiles();
            if (files == null) { // null if security restricted
                throw new IOException("Failed to list contents of directory: " + file);
            }

            IOException exception = null;
            for (File fl : files) {
                try {
                    delete(fl);
                } catch (IOException ioe) {
                    exception = ioe;
                }
            }

            if (null != exception) {
                throw exception;
            }

            if (!file.delete()) {
                throw new IOException("Unable to delete directory: " + file);
            }
        } else {
            boolean filePresent = file.exists();
            if (!file.delete()) {
                if (!filePresent) {
                    throw new FileNotFoundException("File does not exist: " + file);
                }
                throw new IOException("Unable to delete file: " + file);
            }
        }
    }

}
