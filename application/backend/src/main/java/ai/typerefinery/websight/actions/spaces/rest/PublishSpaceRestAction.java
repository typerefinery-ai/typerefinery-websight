package ai.typerefinery.websight.actions.spaces.rest;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.jcr.Session;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.JcrConstants;
import org.apache.jackrabbit.api.security.user.Authorizable;
import org.apache.jackrabbit.api.security.user.UserManager;
import org.apache.jackrabbit.core.TransactionException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.JGitInternalException;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ai.typerefinery.websight.actions.assets.rest.PublishTreeAssetsRestAction;
import ai.typerefinery.websight.actions.pages.rest.PublishTreePagesRestAction;
import ai.typerefinery.websight.utils.SlingConstants;
import ai.typerefinery.websight.utils.git.GitConfig;
import ai.typerefinery.websight.utils.git.GitUtil;
import pl.ds.websight.pages.core.api.Page;
import pl.ds.websight.publishing.framework.PublishService;
import pl.ds.websight.rest.framework.RestAction;
import pl.ds.websight.rest.framework.RestActionResult;
import pl.ds.websight.rest.framework.annotations.PrimaryTypes;
import pl.ds.websight.rest.framework.annotations.SlingAction;

import org.apache.sling.jcr.base.util.AccessControlUtil;

@SlingAction
@PrimaryTypes({ "ws:PagesSpace" })
@Component
public class PublishSpaceRestAction extends AbstractSpacesRestAction<SpacesRestModel, Void>
        implements RestAction<SpacesRestModel, Void> {

    private static final Logger LOG = LoggerFactory.getLogger(PublishSpaceRestAction.class);

    public static final String PAGES_SPACE_RESOURCE_TYPE = "typerefinery/components/structure/pagesspace";
    public static final String ASSEPS_SPACE_RESOURCE_TYPE = "typerefinery/components/structure/assetsspace";

    public static final String DEFAULT_GIT_USER_NAME = "typerefinery";
    public static final String DEFAULT_GIT_USER_EMAIL = "deploy@typerefinery.ai";
    
    @Reference
    private PublishService publishService;

    RestActionResult<Void> execute(SpacesRestModel model, List<Resource> resources) {

        // publish pages and assets recursively
        boolean isAllPages = Boolean.valueOf(model.getOptions().equals("all"));
        boolean isOnlyPublished = Boolean.valueOf(model.getOptions().equals("onlypublished"));
        boolean isDeploy = model.getDeploy();
        boolean isAssetsSuccess = false;
        boolean isPagesSuccess = false;

        // for each resources, check if it is a page and asset children and run publish
        // on them
        for (Resource resource : resources) {
            // check if resource has pages child
            Resource pagesChild = resource.getChild("pages");
            ValueMap pagesChildValueMap = pagesChild.getValueMap();
            Boolean canPublishPages = false;
            Resource pagesChildContent = pagesChild.getChild(JcrConstants.JCR_CONTENT);
            //patch pages node if it does not have sling:resourceType
            if (pagesChildContent == null) {
                try {
                    // ModifiableValueMap pagesChildValueMapMVM = pagesChild.adaptTo(ModifiableValueMap.class);
                    // pagesChildValueMapMVM.put(SlingConstants.SLING_RESOURCE_TYPE_PROPERTY, PAGES_SPACE_RESOURCE_TYPE);
                    // add child resource "jcr:content" with properties
                    Map<String, Object> properties = new HashMap<>();
                    properties.put(SlingConstants.SLING_RESOURCE_TYPE_PROPERTY, "typerefinery/components/structure/pagesspace");
                    properties.put(JcrConstants.JCR_PRIMARYTYPE, "ws:PageContent");
                    properties.put("ws:template", "/apps/typerefinery/templates/pagesspace");
                    pagesChild.getResourceResolver().create(pagesChild, JcrConstants.JCR_CONTENT, properties);
                    pagesChild.getResourceResolver().commit();
                    canPublishPages = true;
                } catch (Exception e) {
                    LOG.error("Error patching pages node {}. {}", pagesChild.getPath(), e);
                }
            } else {
                canPublishPages = true;
            }
            if (pagesChild != null && canPublishPages) {
                // publish pages
                List<Resource> pagesChildList = new ArrayList<>();
                pagesChildList.add(pagesChild);
                RestActionResult<Void> publishPagesResult = PublishTreePagesRestAction.publishPages(isAllPages,
                        isOnlyPublished, pagesChildList, publishService);
                isPagesSuccess = publishPagesResult.getStatus().equals(RestActionResult.Status.SUCCESS);
            }

            if (!isPagesSuccess) {
                LOG.error("Error publishing pages {}.", pagesChild.getPath());
                return RestActionResult.failure("Failed", "Failed to publish pages.");
            }

            // check if resource has assets child
            Resource assetsChild = resource.getChild("assets");
            ValueMap assetsChildValueMap = assetsChild.getValueMap();
            Boolean canPublishAssets = false;
            Resource assetsChildContent = assetsChild.getChild(JcrConstants.JCR_CONTENT);
            if (assetsChildContent == null) {
                try {
                    // ModifiableValueMap assetsChildValueMapMVM = assetsChild.adaptTo(ModifiableValueMap.class);
                    // assetsChildValueMapMVM.put(SlingConstants.SLING_RESOURCE_TYPE_PROPERTY, ASSEPS_SPACE_RESOURCE_TYPE);
                    // add child resource "jcr:content" with properties
                    Map<String, Object> properties = new HashMap<>();
                    properties.put(SlingConstants.SLING_RESOURCE_TYPE_PROPERTY, "typerefinery/components/structure/assetsspace");
                    properties.put(JcrConstants.JCR_PRIMARYTYPE, "ws:PageContent");
                    properties.put("ws:template", "/apps/typerefinery/templates/assetsspace");
                    assetsChild.getResourceResolver().create(assetsChild, JcrConstants.JCR_CONTENT, properties);
                    assetsChild.getResourceResolver().commit();
                    canPublishAssets = true;
                } catch (Exception e) {
                    LOG.error("Error patching assets node {}. {}", pagesChild.getPath(), e);
                }
            } else {
                canPublishAssets = true;
            }
            if (assetsChild != null && canPublishAssets) {
                // publish pages
                List<Resource> assetChildList = new ArrayList<>();
                assetChildList.add(assetsChild);
                RestActionResult<Void> publishAssetsResult = PublishTreeAssetsRestAction.publishAssets(assetChildList,
                        publishService);
                isAssetsSuccess = publishAssetsResult.getStatus().equals(RestActionResult.Status.SUCCESS);
            }

            if (!isAssetsSuccess) {
                LOG.error("Error publishing assets {}.", assetsChild.getPath());
                return RestActionResult.failure("Failed", "Failed to publish assets.");
            }

            // do deploy if both assets and pages are successful
            if (isAssetsSuccess && isPagesSuccess && isDeploy) {
                // do jgit publish on docroot folder
                GitConfig gitConfig = null;
                try {
                    Resource pagesRoot = resource.getChild("pages");
                    // quick fail if pagesRoot is null  
                    if (pagesRoot == null) {
                        LOG.error("No pages to deploy.");
                        return RestActionResult.failure("Failed", "No pages to deploy.");
                    }

                    Resource adminChild = pagesRoot.getChild("_admin");
                    // quick fail if adminChild is null
                    if (adminChild == null) {
                        LOG.error("No admin page with config to deploy.");
                        return RestActionResult.failure("Failed", "No admin page with config to deploy.");
                    }

                    Page adminChildPage = adminChild.adaptTo(Page.class);
                    Map<String, Object> adminChildProperties = adminChildPage.getContentProperties();
                    if (adminChildProperties == null) {
                        LOG.error("Admin config page does not have any properties.");
                        return RestActionResult.failure("Failed",
                                "Admin config page does not have any properties.");
                    }
                    // ValueMap adminChildValueMap = adminChild.getValueMap();

                    String repositoryUrl = adminChildProperties.containsKey("deployGithubRepositoryUrl")
                            ? adminChildProperties.get("deployGithubRepositoryUrl").toString()
                            : "";
                    String branch = adminChildProperties.containsKey("deployGithubBranch")
                            ? adminChildProperties.get("deployGithubBranch").toString()
                            : "";
                    String token = adminChildProperties.containsKey("deployGithubToken")
                            ? adminChildProperties.get("deployGithubToken").toString()
                            : "";
                    String configUsername = adminChildProperties.containsKey("deployGithubUserName")
                            ? adminChildProperties.get("deployGithubUserName").toString()
                            : "";

                    String configEmail = adminChildProperties.containsKey("deployGithubUserEmail")
                            ? adminChildProperties.get("deployGithubUserEmail").toString()
                            : "";
                    
                    // get publishPaths resource with children that have attribute path from admin config page
                    Resource publishPaths = adminChildPage.getContentResource().getChild("publishPaths");
                    List<String> publishPathsList = new ArrayList<>();
                    if (publishPaths != null) {                                    
                        Iterator<Resource> publishPathsChildren = publishPaths.listChildren();
                        while (publishPathsChildren.hasNext()) {
                            Resource publishPathsChild = publishPathsChildren.next();
                            ValueMap publishPathsChildValueMap = publishPathsChild.getValueMap();
                            String path = publishPathsChildValueMap.containsKey("path")
                                    ? publishPathsChildValueMap.get("path").toString() : "";
                            if (StringUtils.isNotBlank(path)) {
                                publishPathsList.add(path);
                            }
                        }
                    }

                    if (StringUtils.isBlank(repositoryUrl) || StringUtils.isBlank(branch)
                            || StringUtils.isBlank(token)) {
                        LOG.error("Space admin config properties are not complete.");
                        return RestActionResult.failure("Failed",
                                "Admin config properties are not complete.");
                    }

                    if (!repositoryUrl.endsWith(".git")) {
                        repositoryUrl = repositoryUrl + ".git";
                    }
                                            
                    // get current user
                    Session session = resource.getResourceResolver().adaptTo(Session.class);
                    UserManager userManager = AccessControlUtil.getUserManager(session);
                    String userId = session.getUserID();
                    Authorizable user = userManager.getAuthorizable(userId);

                    // this will mean they have a profile and with email, otherwise they are admin
                    Boolean userHasProfile = user.hasProperty("profile/email");

                    // get user email and username
                    String user_email = user.hasProperty("profile/email") ? user.getProperty("profile/email").toString() : (StringUtils.isNotBlank(configEmail) ? configEmail : DEFAULT_GIT_USER_EMAIL);
                    String user_name = userHasProfile ? user.getID() : (StringUtils.isNotBlank(configUsername) ? configUsername : DEFAULT_GIT_USER_NAME);

                    // get environment variable PUBLISH_DOCROOT
                    String docrootPath = System.getenv("PUBLISH_DOCROOT");

                    // create new folder docroot/deploy/githuib/<space-name>
                    Path publishPagesPath = Paths.get(docrootPath,"deploy","github", resource.getName());                                
                    publishPagesPath.toFile().mkdirs();
                    
                    // where is the current site cache located
                    Path siteCachePath = Paths.get(docrootPath, resource.getPath(), "pages");

                    // create git config object
                    gitConfig = new GitConfig(
                        repositoryUrl, 
                        publishPagesPath, 
                        branch, 
                        token, 
                        DEFAULT_GIT_USER_EMAIL, 
                        DEFAULT_GIT_USER_NAME
                    );
                    
                    // get git object
                    GitUtil.initializeGit(gitConfig, true);

                    // copy all from from sitePathFolder to publishPagesPath, all pages go into root
                    if (siteCachePath.toFile().exists()) {
                        FileUtils.copyDirectory(siteCachePath.toFile(), publishPagesPath.toFile());
                    }

                    // where is the current site cache located
                    Path assetsPath = Paths.get(docrootPath.toString(), resource.getPath(), "assets");

                    // create new folder docroot/deploy/githuib/<space-name>/assets, all assets go into root/assets
                    Path publishAssetsPath = Paths.get(docrootPath,"deploy","github", resource.getName(), "assets"); 
                    publishAssetsPath.toFile().mkdirs();

                    //copy assetsPathFolder folder to publishAssetsPathFolder
                    if (assetsPath.toFile().exists()) {
                        FileUtils.copyDirectory(assetsPath.toFile(), publishAssetsPath.toFile());
                    }
                    // create new folder docroot/deploy/githuib/etc.clientlibs, all clientlibs go into root/etc.clientlibs
                    Path publishEtcPath = Paths.get(docrootPath,"deploy","github", resource.getName(), "etc.clientlibs");
                    publishEtcPath.toFile().mkdirs();

                    // where is the current clientlibs cache located
                    Path etcPath = Paths.get(docrootPath.toString(), "etc.clientlibs");

                    // copy into it the contents of the /etc.clientlibs folder to deploy folder
                    if (siteCachePath.toFile().exists()) {
                        FileUtils.copyDirectory(etcPath.toFile(), publishEtcPath.toFile());
                    }

                    // copy additional paths from publishPathsList
                    for (String path : publishPathsList) {
                        Path publishPath = Paths.get(docrootPath.toString(), path);
                        Path publishPathDestination = Paths.get(docrootPath,"deploy","github", resource.getName(), path);
                        publishPathDestination.toFile().mkdirs();
                        if (publishPath.toFile().exists()) {
                            FileUtils.copyDirectory(publishPath.toFile(), publishPathDestination.toFile());
                        }
                    }

                    // add all files to git
                    GitUtil.createCommit(gitConfig, ".", "Deployed from " + resource.getPath());

                    // push to git remote
                    GitUtil.push(gitConfig);

                    
                
                } catch (Exception ex) {
                    LOG.error("Error while publishing to github: {}", ex);
                    return RestActionResult.failure("Failed", MessageFormat.format("Error while publishing to github, {}", ex.getMessage()));
                } finally {
                    if (gitConfig.git != null) {
                        gitConfig.git.close();
                    }
                }

                return RestActionResult.success("Success", "Site published and pushed to GitHub.");
            }

        }

        return RestActionResult.success("Failed", "Failed to publish site and push to GitHub.");

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