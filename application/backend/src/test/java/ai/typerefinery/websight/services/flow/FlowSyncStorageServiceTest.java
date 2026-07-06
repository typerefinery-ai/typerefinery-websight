package ai.typerefinery.websight.services.flow;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.observation.ResourceChange;
import org.apache.sling.testing.mock.sling.junit5.SlingContext;
import org.apache.sling.testing.mock.sling.junit5.SlingContextExtension;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(SlingContextExtension.class)
class FlowSyncStorageServiceTest {

    private final SlingContext context = new SlingContext();

    private static class CapturingFlowService extends FlowService {
        private Resource capturedResource;
        private ResourceChange.ChangeType capturedChangeType;
        private boolean result = true;

        @Override
        public boolean doProcessFlowResource(Resource resource, ResourceChange.ChangeType changeType) {
            this.capturedResource = resource;
            this.capturedChangeType = changeType;
            return this.result;
        }
    }

    @Test
    void getComponentPath_mapsVarPathBackToContentPath() {
        FlowSyncStorageService service = new FlowSyncStorageService();

        assertThat(service.getComponentPath("/var/typerefinery/flow/content/site/page/jcr:content/root/container/form"))
            .isEqualTo("/content/site/page/jcr:content/root/container/form");
        assertThat(service.getComponentPath("/content/site/page/jcr:content/root/container/form"))
            .isEqualTo("/content/site/page/jcr:content/root/container/form");
    }

    @Test
    void syncVarToFlow_usesOriginalComponentResource() throws Exception {
        FlowSyncStorageService service = new FlowSyncStorageService();
        CapturingFlowService flowService = new CapturingFlowService();
        inject(service, "flowService", flowService);

        Resource componentResource = context.create().resource(
            "/content/site/page/jcr:content/root/container/form",
            "sling:resourceType", "typerefinery/components/forms/form"
        );
        Resource varResource = context.create().resource(
            "/var/typerefinery/flow/content/site/page/jcr:content/root/container/form",
            "flowapi_enable", true
        );

        boolean result = service.syncVarToFlow(varResource, ResourceChange.ChangeType.CHANGED);

        assertThat(result).isTrue();
        assertThat(flowService.capturedResource).isNotNull();
        assertThat(flowService.capturedResource.getPath()).isEqualTo(componentResource.getPath());
        assertThat(flowService.capturedChangeType).isEqualTo(ResourceChange.ChangeType.CHANGED);
    }

    private static void inject(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
