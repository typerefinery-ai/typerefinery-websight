package ai.typerefinery.websight.actions.spaces;

import java.util.Map;

import org.apache.sling.api.resource.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ai.typerefinery.websight.actions.spaces.rest.PublishSpaceRestAction;
import pl.ds.websight.pages.core.api.Page;
import pl.ds.websight.rest.framework.RestActionResult;

public class SpaceUtil {

    private static final Logger LOG = LoggerFactory.getLogger(PublishSpaceRestAction.class);

    public static SpaceConfigModel getSpaceConfig(Resource space) {
        SpaceConfigModel spaceConfig = new SpaceConfigModel();
        try {
            Resource pagesRoot = space.getChild("pages");
            // quick fail if pagesRoot is null  
            if (pagesRoot == null) {
                LOG.error("No pages to deploy.");
                return spaceConfig;
            }

            Resource adminChild = pagesRoot.getChild("_admin");
            // quick fail if adminChild is null
            if (adminChild == null) {
                LOG.error("No admin page with config to deploy.");
                return spaceConfig;
            }

            Page adminChildPage = adminChild.adaptTo(Page.class);
            Map<String, Object> adminChildProperties = adminChildPage.getContentProperties();
            if (adminChildProperties == null) {
                LOG.error("Admin config page does not have any properties.");
                return spaceConfig;
            }
            // ValueMap adminChildValueMap = adminChild.getValueMap(

            spaceConfig.repositoryUrl = adminChildProperties.containsKey("deployGithubRepositoryUrl")
                ? adminChildProperties.get("deployGithubRepositoryUrl").toString()
                : "";
            spaceConfig.branch = adminChildProperties.containsKey("deployGithubBranch")
                ? adminChildProperties.get("deployGithubBranch").toString()
                : "";
            spaceConfig.token = adminChildProperties.containsKey("deployGithubToken")
                ? adminChildProperties.get("deployGithubToken").toString()
                : "";
            spaceConfig.configUsername = adminChildProperties.containsKey("deployGithubUserName")
                ? adminChildProperties.get("deployGithubUserName").toString()
                : "";

            spaceConfig.configEmail = adminChildProperties.containsKey("deployGithubUserEmail")
                ? adminChildProperties.get("deployGithubUserEmail").toString()
                : "";
            spaceConfig.branchContent = adminChildProperties.containsKey("contentGithubBranch")
                ? adminChildProperties.get("contentGithubBranch").toString()
                : "";

            } catch (Exception e) {
            LOG.error("Error getting space config.", e);
        }
        return spaceConfig;
    }

}
