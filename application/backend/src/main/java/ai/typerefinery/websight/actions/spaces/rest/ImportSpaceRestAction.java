package ai.typerefinery.websight.actions.spaces.rest;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.List;
import javax.jcr.Session;

import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.vault.fs.api.PathFilterSet;
import org.apache.jackrabbit.vault.fs.io.AccessControlHandling;
import org.apache.jackrabbit.vault.packaging.JcrPackage;
import org.apache.jackrabbit.vault.packaging.JcrPackageManager;
import org.apache.jackrabbit.vault.packaging.Packaging;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.event.jobs.JobManager;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ai.typerefinery.websight.actions.spaces.SpaceConfigModel;
import ai.typerefinery.websight.actions.spaces.SpaceUtil;
import ai.typerefinery.websight.repository.JcrPackageEditFacade;
import ai.typerefinery.websight.repository.JcrPackageUtil;
import ai.typerefinery.websight.repository.RepositoryUtil;
import ai.typerefinery.websight.utils.git.GitConfig;
import ai.typerefinery.websight.utils.git.GitUtil;
import pl.ds.websight.rest.framework.RestAction;
import pl.ds.websight.rest.framework.RestActionResult;
import pl.ds.websight.rest.framework.annotations.PrimaryTypes;
import pl.ds.websight.rest.framework.annotations.SlingAction;
// import pl.ds.websight.packagemanager.JcrPackageEditFacade;
// import pl.ds.websight.packagemanager.util.JcrPackageUtil;
import static ai.typerefinery.websight.actions.spaces.SpaceConfigModel.*;

@SlingAction
@PrimaryTypes({ "ws:PagesSpace" })
@Component
public class ImportSpaceRestAction extends AbstractSpacesRestAction<SpacesRestModel, Void>
        implements RestAction<SpacesRestModel, Void> {

    private static final Logger LOG = LoggerFactory.getLogger(ImportSpaceRestAction.class);
    
    @Reference
    private Packaging packaging;
    
    @Reference
    private JobManager jobManager;

    RestActionResult<Void> execute(SpacesRestModel model, List<Resource> resources) {

        // publish pages and assets recursively
        boolean iBackup = model.getBackup();

        // this would only run on one space
        for (Resource resource : resources) {
            
            try {

                // get space config
                SpaceConfigModel spaceConfig = SpaceUtil.getSpaceConfig(resource);

                if (StringUtils.isNotBlank(spaceConfig.repositoryUrl)) {
                    // get environment variable GIT_CONTENT_ROOT
                    String contentRootPath = System.getenv(DEFAULT_GIT_CONTENT_ROOT_ENV_VAR);
                    if (StringUtils.isBlank(contentRootPath)) {
                        contentRootPath = DEFAULT_LOCAL_CONTENT_ROOT_PATH;
                    }

                    // create new folder docroot/content/github/<space-name>
                    Path contentSpacePath = Paths.get(contentRootPath,DEFAULT_LOCAL_PATH,spaceConfig.getGitProvider(), resource.getName());                                
                    contentSpacePath.toFile().mkdirs();
                    
                    // get content to import from git repo if repository url is not blank
                    if (StringUtils.isNotBlank(spaceConfig.repositoryUrl)) {
                        // push to git
                        GitConfig gitConfig = null;
                        try {
                            // create git config object
                            gitConfig = new GitConfig(
                                spaceConfig.repositoryUrl, 
                                contentSpacePath, 
                                spaceConfig.branchContent, 
                                spaceConfig.token, 
                                spaceConfig.configEmail, 
                                spaceConfig.configUsername
                            );

                            // get git object
                            GitUtil.initializeGit(gitConfig, true);

                            // push to git remote
                            GitUtil.pull(gitConfig, null);

                        } catch (Exception ex) {
                            // TODO Auto-generated catch block
                            ex.printStackTrace();
                            return RestActionResult.failure("Failed", MessageFormat.format("Error while exporting to github, {}", ex.getMessage()));
                        }
                    } else {
                        LOG.error("Repository URL is blank, not exporting to github.");
                    }

                    // backup current content to package if backup is true
                    if (iBackup && packaging != null) {
                        Session session = resource.getResourceResolver().adaptTo(Session.class);
                        if (session == null) {
                            LOG.warn("Could not get session from resource resolver");
                            return RestActionResult.failure("Failed", "Could not get session from resource resolver");
                        }
                        JcrPackageManager packageManager = this.packaging.getPackageManager(session);
                        if (packageManager == null) {
                            LOG.warn("Could not get package manager");
                            return RestActionResult.failure("Failed", "Could not get package manager");
                        }
                        String packageGroup = DEFAULT_PACKAGE_GROUP;
                        String packageName = DEFAULT_PACKAGE_PREFIX + resource.getName() + "-" + System.currentTimeMillis();
                        String packageVersion = DEFAULT_PACKAGE_VERSION;
                        JcrPackage createdPackage = packageManager.create(packageGroup, packageName, packageVersion);
                        if (createdPackage == null) {
                            LOG.warn("Could not create package");
                            return RestActionResult.failure("Failed", "Could not create package");
                        }
                        try {
                            JcrPackageEditFacade editFacade = JcrPackageEditFacade.forPackage(createdPackage);
                            if (editFacade == null) {
                                LOG.warn("Could not access definition after creating a package: {}",  JcrPackageUtil.getSimplePackageName(packageName, packageVersion));
                                if (createdPackage != null) {
                                    createdPackage.close(); 
                                }
                                return RestActionResult.failure("Failed", MessageFormat.format("Error exporting space, package '{0}' has been created, but could not save details.", packageName));
                            }
                            List<PathFilterSet> filters = new ArrayList<>();
                            filters.add(new PathFilterSet(resource.getPath()));
                            editFacade.setFilters(filters);

                            editFacade.setAcHandling(AccessControlHandling.IGNORE);
                            editFacade.setRequiresRestart(false);
                            editFacade.setDependencies(new ArrayList<>(0));
                            session.save();

                            packageManager.assemble(createdPackage, null);

                        } catch (Exception e) {
                            LOG.error("Error creating package", e);
                            return RestActionResult.failure("Failed", MessageFormat.format("Error creating space, package '{0}' has been created, but could not be built.", packageName));
                        }
                        
                    }

                    // import content from disk to jcr
                    RepositoryUtil.jcrImport(resource.getResourceResolver(), contentSpacePath.toString(), resource.getPath(), true);
                
                    return RestActionResult.success("Success", "Space exported successfully.");
                } else {
                    LOG.error("Repository URL is blank, not exporting to github.");
                    return RestActionResult.failure("Failed", "Please configure space with Git config.");
                }

            } catch (Exception e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
                return RestActionResult.failure("Failed", "Error exporting space.");
            }

        }

        return RestActionResult.failure("Failed", "Could not export space.");
    }

    private RestActionResult<Void> getSuccessResult(int assetsCount) {
        String message = "Publishing requested";
        String messageDetails = String.format("Publishing requested successfully for %d %s",
                new Object[] { Integer.valueOf(assetsCount),
                        (assetsCount == 1) ? "asset" : "assets" });
        return RestActionResult.success(message, messageDetails);
    }

    String getFailureMessage(SpacesRestModel model) {
        return "Error while requesting publishing";
    }
}