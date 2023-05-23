package ai.typerefinery.websight.utils.git;

import java.io.File;
import java.nio.file.Path;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

import org.apache.commons.lang3.StringUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.transport.CredentialsProvider;

import lombok.Getter;
import lombok.Setter;

public class GitConfig {
    @Getter
    @Setter
    public String uri;
    @Getter
    @Setter
    public File localFolder;
    @Getter
    @Setter
    public Path localPath;
    @Getter
    @Setter
    public String branch;
    @Getter
    @Setter
    public String baseBranch;
    @Getter
    @Setter
    public String authToken;
    @Getter
    @Setter
    public String authUsername;
    @Getter
    @Setter
    public String authPassword;
    @Getter
    @Setter
    public String email; //git config --global user.email <email>
    @Getter
    @Setter
    public String name; //git config --global user.name <name>
    @Getter
    @Setter
    public boolean force;

    @Getter
    @Setter
    public NotResettableCredentialsProvider credentialsProvider;

    @Getter
    @Setter
    public Git git;

    @Getter
    @Setter
    public ReadWriteLock repositoryLock = new ReentrantReadWriteLock();


    @Getter
    @Setter
    public ReentrantLock remoteRepoLock = new ReentrantLock();

    @Getter
    @Setter 
    public int failedAuthenticationSeconds;

    @Getter
    @Setter
    public Integer maxAuthenticationAttempts;
    
    @Getter
    @Setter
    public Boolean gcAutoDetach;

    @Getter
    @Setter
    public volatile boolean noVerify = true;

    @Getter
    @Setter
    public boolean useLFS = false;

    @Getter
    @Setter
    public int connectionTimeout = 60;

    @Getter
    @Setter
    public String commentTemplate;
    @Getter
    @Setter
    public String escapedCommentTemplate;

    @Getter
    @Setter
    public CommitMessageParser commitMessageParser;

    @Getter
    @Setter
    public String tagPrefix = StringUtils.EMPTY;
    
    public GitConfig() {

    }

    public GitConfig(String uri, Path localPath, String branch, String token, String email, String name) {
        this.uri = uri;
        this.localFolder = localPath.toFile();
        this.localPath = localPath;
        this.branch = branch;
        this.baseBranch = branch;
        this.authToken = token;
        this.email = email;
        this.name = name;
    }
}
