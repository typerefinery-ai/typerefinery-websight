package ai.typerefinery.websight.actions.spaces.rest;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.MessageFormat;
import java.util.List;
import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.vault.packaging.Packaging;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.event.jobs.JobManager;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ai.typerefinery.websight.actions.spaces.SpaceConfigModel;
import ai.typerefinery.websight.actions.spaces.SpaceUtil;
import ai.typerefinery.websight.repository.RepositoryUtil;
import ai.typerefinery.websight.utils.git.GitConfig;
import ai.typerefinery.websight.utils.git.GitUtil;
import pl.ds.websight.rest.framework.RestAction;
import pl.ds.websight.rest.framework.RestActionResult;
import pl.ds.websight.rest.framework.annotations.PrimaryTypes;
import pl.ds.websight.rest.framework.annotations.SlingAction;
import static ai.typerefinery.websight.actions.spaces.SpaceConfigModel.*;

@SlingAction
@PrimaryTypes({ "ws:PagesSpace" })
@Component
public class ExportSpaceRestAction extends AbstractSpacesRestAction<SpacesRestModel, Void>
        implements RestAction<SpacesRestModel, Void> {

    private static final Logger LOG = LoggerFactory.getLogger(ExportSpaceRestAction.class);
    
    @Reference
    private Packaging packaging;
    
    @Reference
    private JobManager jobManager;

    RestActionResult<Void> execute(SpacesRestModel model, List<Resource> resources) {

        // publish pages and assets recursively
        boolean isCommit = model.getCommit();

        // this would only run on one space
        for (Resource resource : resources) {
            
            try {

                // get space config
                SpaceConfigModel spaceConfig = SpaceUtil.getSpaceConfig(resource);

                if (StringUtils.isNotBlank(spaceConfig.repositoryUrl)) {

                    // get environment variable GIT_CONTENT_ROOT
                    String docrootPath = System.getenv(DEFAULT_GIT_CONTENT_ROOT_ENV_VAR);
                    if (StringUtils.isBlank(docrootPath)) {
                        docrootPath = DEFAULT_LOCAL_CONTENT_ROOT_PATH;
                    }

                    // create new folder docroot/export/githuib/<space-name>
                    Path contentSpacePath = Paths.get(docrootPath,DEFAULT_LOCAL_PATH, spaceConfig.getGitProvider(), resource.getName());                                
                    contentSpacePath.toFile().mkdirs();

                    GitConfig gitConfig = null;
                    // clone git repo to docroot/export/githuib/<space-name>
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
                        GitUtil.initializeGit(gitConfig, true, true);

                        // get latest from git remote
                        GitUtil.pull(gitConfig, null);

                    } catch (Exception ex) {
                        // TODO Auto-generated catch block
                        ex.printStackTrace();
                        return RestActionResult.failure("Failed", MessageFormat.format("Error while exporting to github, {}", ex.getMessage()));
                    }

                    // export pages to docroot/export/githuib/<space-name>
                    RepositoryUtil.jcrExport(resource.getResourceResolver(), contentSpacePath.toString(), resource.getPath(), true);

                    Path jcrRootToCommit = Paths.get(contentSpacePath.toString(), "jcr_root");

                    if (isCommit && jcrRootToCommit.toFile().exists()) {

                            try {

                                // add all files to git
                                GitUtil.createCommit(gitConfig, ".", "Exported from " + resource.getPath());

                                // push to git remote
                                GitUtil.push(gitConfig);

                            } catch (Exception ex) {
                                // TODO Auto-generated catch block
                                ex.printStackTrace();
                                return RestActionResult.failure("Failed", MessageFormat.format("Error while exporting to github, {}", ex.getMessage()));
                            }
                    } else {
                        LOG.info("Not committing to github.");
                    }

                } else {
                    LOG.error("Repository URL is blank, not exporting to github.");
                    return RestActionResult.failure("Failed", "Please configure space with Git config.");
                }

                return RestActionResult.success("Success", "Space exported successfully.");
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