package ai.typerefinery.websight.actions.assets.rest;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import org.apache.sling.api.resource.Resource;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import pl.ds.websight.assets.space.service.PublishAssetResult;
import pl.ds.websight.assets.space.service.PublishAssetService;
import pl.ds.websight.rest.framework.RestAction;
import pl.ds.websight.rest.framework.RestActionResult;
import pl.ds.websight.rest.framework.annotations.PrimaryTypes;
import pl.ds.websight.rest.framework.annotations.SlingAction;

import pl.ds.websight.assets.core.api.Asset;
import pl.ds.websight.assets.space.service.PublishAssetResult;
import pl.ds.websight.assets.space.service.PublishAssetService;
import pl.ds.websight.publishing.framework.PublishAction;
import pl.ds.websight.publishing.framework.PublishException;
import pl.ds.websight.publishing.framework.PublishOptions;
import pl.ds.websight.publishing.framework.PublishService;

@SlingAction
@PrimaryTypes({"nt:folder", "ws:Assets"})
@Component
public class PublishTreeAssetsRestAction extends AbstractAssetsRestAction<AssetsRestModel, Void> implements RestAction<AssetsRestModel, Void> {

private static final Logger LOG = LoggerFactory.getLogger(PublishTreeAssetsRestAction.class);

    @Reference
    private PublishService publishService;

    RestActionResult<Void> execute(AssetsRestModel model, List<Resource> resources) {
        return publishAssets(resources, this.publishService);
        // Map<String, List<String>> resourceResult = new HashMap<>();
        // boolean isAllPages = Boolean.valueOf(model.getOptions().equals("all"));
        // boolean isOnlyPublished =
        // Boolean.valueOf(model.getOptions().equals("onlypublished"));
        // for (Resource resource : resources) {

        // PublishAssetResult publishResult =
        // this.publishAssetService.publish(resources);
        // if (publishResult.isSuccess())
        // return getSuccessResult(publishResult.getNumberOfSuccesses());
        // int requestedAssetsCount = publishResult.getNumberOfSuccesses();
        // return RestActionResult.failure(getFailureMessage(model), publishResult
        // .getErrorMessage() + publishResult.getErrorMessage());
        // }
    }

    private static RestActionResult<Void> getSuccessResult(int assetsCount) {
        String message = "Publishing requested";
        String messageDetails = String.format("Publishing requested successfully for %d %s",
                new Object[] { Integer.valueOf(assetsCount),
                        (assetsCount == 1) ? "asset" : "assets" });
        return RestActionResult.success(message, messageDetails);
    }

    String getFailureMessage(AssetsRestModel model) {
        return "Error while requesting publishing";
    }

    public static RestActionResult<Void> publishAssets(List<Resource> resources, PublishService publishService) {
        PublishAction publishAction = PublishAction.PUBLISH;
        Collection<Resource> assetsResources = streamAssetsResources(resources).limit(1000L).toList();
        List<ProcessedAsset> processedAssets = new ArrayList<>();
        try {
            for (Resource resource : assetsResources)
                processedAssets.add(requestProcess(resource, publishAction, publishService));
        } catch (PublishException e) {
            LOG.debug("Asset publishing corrupted by en error.", (Throwable) e);
            return RestActionResult.failure("Processed: " + processedAssets.size(), e.getMessage());
        }
        if (isAnyAssetUnprocessed(processedAssets)) {
            Collection<ProcessedAsset> unpublishedAssets = filterUnprocessedAssets(processedAssets);
            LOG.debug("Could not found any publish processor for assets: {}", unpublishedAssets
                    .stream().map(ProcessedAsset::getResourcePath)
                    .collect(Collectors.joining(", ")));
            return RestActionResult.failure("Processed: " + processedAssets.size() + " - Unpublished: " + unpublishedAssets.size(),
                    "Could not found any publish processor for requested resource.");
        }
        return getSuccessResult(processedAssets.size());
    }

    private static Stream<Resource> streamAssetsResources(List<Resource> resources) {
        return resources.stream()
                .flatMap(PublishTreeAssetsRestAction::streamAssetsResources);
    }

    private static Stream<Resource> streamAssetsResources(Resource resource) {
        if (isAsset(resource))
            return Stream.of(resource);
        if (isAssetsFolder(resource))
            return streamAssetsResources(
                    (List<Resource>) StreamSupport.stream(resource.getChildren().spliterator(), false)
                            .collect(Collectors.toList()));
        return Stream.empty();
    }

    private static ProcessedAsset requestProcess(Resource resource, PublishAction publishAction, PublishService publishService) throws PublishException {
        List<String> processors = publishService.publish(resource,
                new PublishOptions(publishAction, new HashMap<>()));
        return new ProcessedAsset(resource, processors);
    }

    private static boolean isAnyAssetUnprocessed(List<ProcessedAsset> processedAssetProcessors) {
        return processedAssetProcessors.stream()
                .anyMatch(resourceProcessor -> !resourceProcessor.hasProcessors());
    }

    private static Collection<ProcessedAsset> filterUnprocessedAssets(List<ProcessedAsset> processedAssetProcessors) {
        return (Collection<ProcessedAsset>) processedAssetProcessors.stream()
                .filter(resourceProcessor -> !resourceProcessor.hasProcessors())
                .collect(Collectors.toList());
    }

    private static boolean isAsset(Resource resource) {
        return (resource.adaptTo(Asset.class) != null);
    }

    private static boolean isAssetsFolder(Resource resource) {
        return resource.isResourceType("sling:OrderedFolder");
    }

    private static class ProcessedAsset {
        private final Resource resource;

        private final List<String> processors;

        private ProcessedAsset(Resource resource, List<String> processors) {
            this.resource = resource;
            this.processors = processors;
        }

        String getResourcePath() {
            return this.resource.getPath();
        }

        boolean hasProcessors() {
            return !this.processors.isEmpty();
        }
    }
}