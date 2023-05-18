package ai.typerefinery.websight.actions.spaces.rest;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.PushCommand;
import org.eclipse.jgit.api.RemoteAddCommand;
import org.eclipse.jgit.transport.RefSpec;
import org.eclipse.jgit.transport.URIish;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ai.typerefinery.websight.actions.assets.rest.PublishTreeAssetsRestAction;
import ai.typerefinery.websight.actions.pages.rest.PagesRestModel;
import ai.typerefinery.websight.actions.pages.rest.PublishTreePagesRestAction;
import ai.typerefinery.websight.rest.ResourceItemsRestModel;
import pl.ds.websight.assets.space.service.PublishAssetResult;
import pl.ds.websight.assets.space.service.PublishAssetService;
import pl.ds.websight.pages.core.api.Page;
import pl.ds.websight.publishing.framework.PublishService;
import pl.ds.websight.rest.framework.RestAction;
import pl.ds.websight.rest.framework.RestActionResult;
import pl.ds.websight.rest.framework.annotations.PrimaryTypes;
import pl.ds.websight.rest.framework.annotations.SlingAction;

@SlingAction
@PrimaryTypes({"ws:PagesSpace"})
@Component
public class PublishSpaceRestAction extends AbstractSpacesRestAction<SpacesRestModel, Void> implements RestAction<SpacesRestModel, Void> {

    private static final Logger LOG = LoggerFactory.getLogger(PublishSpaceRestAction.class);

    @Reference
    private PublishService publishService;
  
    RestActionResult<Void> execute(SpacesRestModel model, List<Resource> resources) {

    //publish pages and assets recursively
    boolean isAllPages = Boolean.valueOf(model.getOptions().equals("all"));
    boolean isOnlyPublished = Boolean.valueOf(model.getOptions().equals("onlypublished"));
    boolean isDeploy = model.getDeploy();
    boolean isAssetsSuccess = false;
    boolean isPagesSuccess = false;

    //for each resources, check if it is a page and asset children and run publish on them
    for (Resource resource : resources) {
        // check if resource has pages child
        Resource pagesChild = resource.getChild("pages");
        if (pagesChild != null) {
            // publish pages
            List<Page> pagesChildList = new ArrayList<>();
            pagesChildList.add(pagesChild.adaptTo(Page.class));
            RestActionResult<Void> publishPagesResult = PublishTreePagesRestAction.publishPages(isAllPages, isOnlyPublished, pagesChildList, publishService);
            isPagesSuccess = publishPagesResult.getStatus().equals("OK");
        }
        // check if resource has assets child
        Resource assetsChild = resource.getChild("assets");
        if (pagesChild != null) {
            // publish pages
            List<Resource> pagesChildList = new ArrayList<>();
            pagesChildList.add(pagesChild);
            RestActionResult<Void> publishAssetsResult = PublishTreeAssetsRestAction.publishAssets(pagesChildList, publishService);
            isAssetsSuccess = publishAssetsResult.getStatus().equals("OK");
        }
    
        // do deploy if both assets and pages are successful
        if (isAssetsSuccess && isPagesSuccess) {
            if (isDeploy) {
                try {
                    Resource pagesRoot = resource.getChild("pages");
                    if (pagesChild != null) {
                        Resource adminChild = pagesRoot.getChild("_admin");
                        if (adminChild != null) {                                    
                            Page adminChildPage = adminChild.adaptTo(Page.class);
                            Map<String, Object> adminChildProperties = adminChildPage.getContentProperties();
                            if (adminChildProperties == null) {
                                LOG.error("Admin config page does not have any properties.");
                                return RestActionResult.failure("Failed", "Admin config page does not have any properties.");    
                            }
                            // ValueMap adminChildValueMap = adminChild.getValueMap();

                            String repositoryUrl = adminChildProperties.get("deployGithubRepositoryUrl").toString();
                            String branch = adminChildProperties.get("deployGithubBranch").toString();
                            String token = adminChildProperties.get("deployGithubToken").toString();

                            if (StringUtils.isBlank(repositoryUrl) || StringUtils.isBlank(branch)|| StringUtils.isBlank(token)) {
                                LOG.error("Admin config properties are not complete.");
                                return RestActionResult.failure("Failed", "Admin config properties are not complete.");   
                            }

                            //get environment variable PUBLISH_DOCROOT
                            String docrootPath = System.getenv("PUBLISH_DOCROOT");
                            
                            // get docroot file object
                            File docroot = new File(docrootPath);

                            // do jgit publish on docroot folder
                            Git git = Git.open(docroot); 

                            // add remote repo:
                            RemoteAddCommand remoteAddCommand = git.remoteAdd();
                            remoteAddCommand.setName("github");
                            remoteAddCommand.setUri(new URIish(repositoryUrl));
                            // you can add more settings here if needed
                            remoteAddCommand.call();
                        
                            // push to remote:
                            PushCommand pushCommand = git.push();
                            pushCommand.setForce(true);
                            pushCommand.setRefSpecs(new RefSpec(branch));
                            pushCommand.setCredentialsProvider(new UsernamePasswordCredentialsProvider(token, ""));
                            // you can add more settings here if needed
                            pushCommand.call();
                        } else {
                            LOG.error("No admin page with config to deploy.");
                            return RestActionResult.failure("Failed", "No pages to deploy.");    
                        }
                    } else {
                        LOG.error("No pages to deploy.");
                        return RestActionResult.failure("Failed", "No pages to deploy.");    
                    }

                } catch (Exception ex) {
                    LOG.error("Error while publishing to github", ex);
                    return RestActionResult.failure("Failed", "Failed to deploy pages and assets");
                }
            
            }

            return RestActionResult.success("OK", "OK");
        } 

    }

    return RestActionResult.success("Failed", "Failed to publish pages and assets");
    

    // PublishAssetResult publishResult = this.publishAssetService.publish(resources);
    // if (publishResult.isSuccess())
    //   return getSuccessResult(publishResult.getNumberOfSuccesses()); 
    // int requestedAssetsCount = publishResult.getNumberOfSuccesses();
    // return RestActionResult.failure(getFailureMessage(model), publishResult
    //     .getErrorMessage() + publishResult.getErrorMessage());
  }
  
  private RestActionResult<Void> getSuccessResult(int assetsCount) {
    String message = "Publishing requested";
    String messageDetails = String.format("Publishing requested successfully for %d %s", new Object[] { Integer.valueOf(assetsCount), 
          (assetsCount == 1) ? "asset" : "assets" });
    return RestActionResult.success(message, messageDetails);
  }
  
  String getFailureMessage(SpacesRestModel model) {
    return "Error while requesting publishing";
  }
}