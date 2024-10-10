package ai.typerefinery.websight.actions.spaces;

import java.net.URI;

import org.apache.commons.lang3.StringUtils;

public class SpaceConfigModel {
    
    public static final String PAGES_SPACE_RESOURCE_TYPE = "typerefinery/components/structure/pagesspace";
    public static final String ASSEPS_SPACE_RESOURCE_TYPE = "typerefinery/components/structure/assetsspace";

    public static final String DEFAULT_GIT_USER_NAME = "typerefinery";
    public static final String DEFAULT_GIT_USER_EMAIL = "deploy@typerefinery.ai";

    public static final String DEFAULT_LOCAL_PATH = "content";
    public static final String DEFAULT_LOCAL_CONTENT_ROOT_PATH = "contentroot";
    public static final String DEFAULT_GIT_CONTENT_ROOT_ENV_VAR = "GIT_CONTENT_ROOT";
    public static final String DEFAULT_PACKAGE_GROUP = "space-backup";
    public static final String DEFAULT_PACKAGE_PREFIX = "space-backup-";
    public static final String DEFAULT_PACKAGE_VERSION = "1.0.0";
    public static final String DEFAULT_GIT_PROVIDER = "github";

    public String repositoryUrl;
    public String token;
    public String branch;
    public String branchContent;
    public String configUsername = DEFAULT_GIT_USER_NAME;
    public String configEmail = DEFAULT_GIT_USER_EMAIL;

    public String getGitProvider() {
        if (StringUtils.isEmpty(repositoryUrl)) {
            return DEFAULT_GIT_PROVIDER;
        }
        URI repositoryUri = URI.create(repositoryUrl);

        return repositoryUri.getHost();
    }
}
