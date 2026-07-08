package ai.typerefinery.websight.services.flow;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.resource.observation.ResourceChange;
import org.apache.sling.testing.mock.sling.junit5.SlingContext;
import org.apache.sling.testing.mock.sling.junit5.SlingContextExtension;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(SlingContextExtension.class)
class FlowSyncStorageServiceTest {

    private final SlingContext context = new SlingContext();

    private static class CapturingFlowService extends FlowService {
        private Resource capturedStorageResource;
        private Resource capturedSourceResource;
        private Resource capturedLegacyResource;
        private ResourceChange.ChangeType capturedChangeType;
        private boolean result = true;

        @Override
        public boolean doProcessFlowResource(
                Resource storageResource,
                Resource sourceResource,
                ResourceChange.ChangeType changeType) {
            this.capturedStorageResource = storageResource;
            this.capturedSourceResource = sourceResource;
            this.capturedChangeType = changeType;
            return this.result;
        }

        @Override
        public boolean doProcessFlowResource(Resource resource, ResourceChange.ChangeType changeType) {
            this.capturedLegacyResource = resource;
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
    void syncVarToFlow_usesVarAsStorageAndOriginalComponentAsSource() throws Exception {
        FlowSyncStorageService service = new FlowSyncStorageService();
        CapturingFlowService flowService = new CapturingFlowService();
        inject(service, "flowService", flowService);

        Resource componentResource = context.create().resource(
            "/content/site/page/jcr:content/root/container/form",
            "sling:resourceType", "typerefinery/components/forms/form"
        );
        Resource varResource = context.create().resource(
            "/var/typerefinery/flow/content/site/page/jcr:content/root/container/form",
            "sling:resourceType", "typerefinery/components/forms/form",
            FlowService.prop(FlowService.PROPERTY_ENABLE), true
        );

        boolean result = service.syncVarToFlow(varResource, ResourceChange.ChangeType.CHANGED);

        assertThat(result).isTrue();
        assertThat(flowService.capturedStorageResource).isNotNull();
        assertThat(flowService.capturedSourceResource).isNotNull();
        assertThat(flowService.capturedStorageResource.getPath()).isEqualTo(varResource.getPath());
        assertThat(flowService.capturedSourceResource.getPath()).isEqualTo(componentResource.getPath());
        assertThat(flowService.capturedLegacyResource).isNull();
        assertThat(flowService.capturedChangeType).isEqualTo(ResourceChange.ChangeType.CHANGED);
    }

    @Test
    void syncComponentToVar_copiesUserEditablePropertiesAndResourceType() {
        FlowSyncStorageService service = new FlowSyncStorageService();

        Resource componentResource = context.create().resource(
            "/content/site/page/jcr:content/root/container/form",
            "sling:resourceType", "typerefinery/components/forms/form",
            "jcr:title", "Contact Form",
            FlowService.prop(FlowService.PROPERTY_ENABLE), true,
            FlowService.prop(FlowService.PROPERTY_TEMPLATE), "/apps/templates/flow.json",
            FlowService.prop(FlowService.PROPERTY_TITLE), "Contact Flow",
            FlowService.prop(FlowService.PROPERTY_NAME), "Contact",
            FlowService.prop(FlowService.PROPERTY_GROUP), "Forms",
            FlowService.prop(FlowService.PROPERTY_FLOWSTREAMID), "legacy-flow-id"
        );

        boolean result = service.syncComponentToVar(componentResource);

        assertThat(result).isTrue();

        Resource varResource = context.resourceResolver().getResource(
            "/var/typerefinery/flow/content/site/page/jcr:content/root/container/form"
        );
        assertThat(varResource).isNotNull();

        ValueMap props = varResource.getValueMap();
        assertThat(props.get("sling:resourceType", String.class)).isEqualTo("typerefinery/components/forms/form");
        assertThat(props.get("jcr:title", String.class)).isEqualTo("Contact Form");
        assertThat(props.get(FlowService.prop(FlowService.PROPERTY_ENABLE), Boolean.class)).isTrue();
        assertThat(props.get(FlowService.prop(FlowService.PROPERTY_TEMPLATE), String.class)).isEqualTo("/apps/templates/flow.json");
        assertThat(props.get(FlowService.prop(FlowService.PROPERTY_TITLE), String.class)).isEqualTo("Contact Flow");
        assertThat(props.get(FlowService.prop(FlowService.PROPERTY_NAME), String.class)).isEqualTo("Contact");
        assertThat(props.get(FlowService.prop(FlowService.PROPERTY_GROUP), String.class)).isEqualTo("Forms");
        assertThat(props.get(FlowService.prop(FlowService.PROPERTY_FLOWSTREAMID), String.class))
            .isEqualTo("legacy-flow-id");
        assertThat(componentResource.getValueMap().containsKey(FlowService.prop(FlowService.PROPERTY_FLOWSTREAMID))).isFalse();
    }

    @Test
    void syncComponentToVar_migratesLegacyManagedPropertiesToVarAndRemovesThemFromContent() {
        FlowSyncStorageService service = new FlowSyncStorageService();

        Resource componentResource = context.create().resource(
            "/content/site/page/jcr:content/root/container/form",
            "sling:resourceType", "typerefinery/components/forms/form",
            FlowService.prop(FlowService.PROPERTY_ENABLE), false,
            FlowService.prop(FlowService.PROPERTY_TITLE), "Contact Flow",
            FlowService.prop(FlowService.PROPERTY_FLOWSTREAMID), "flow-123",
            FlowService.prop(FlowService.PROPERTY_EDITURL), "https://flow/edit/flow-123",
            FlowService.prop(FlowService.PROPERTY_HTTPROUTE), "https://flow/route/{{id}}",
            FlowService.prop(FlowService.PROPERTY_WEBSOCKETURL), "wss://flow/ws"
        );

        boolean result = service.syncComponentToVar(componentResource);

        assertThat(result).isTrue();

        Resource varResource = context.resourceResolver().getResource(
            "/var/typerefinery/flow/content/site/page/jcr:content/root/container/form"
        );
        assertThat(varResource).isNotNull();

        ValueMap varProps = varResource.getValueMap();
        assertThat(varProps.get(FlowService.prop(FlowService.PROPERTY_ENABLE), Boolean.class)).isFalse();
        assertThat(varProps.get(FlowService.prop(FlowService.PROPERTY_TITLE), String.class)).isEqualTo("Contact Flow");
        assertThat(varProps.get(FlowService.prop(FlowService.PROPERTY_FLOWSTREAMID), String.class)).isEqualTo("flow-123");
        assertThat(varProps.get(FlowService.prop(FlowService.PROPERTY_EDITURL), String.class)).isEqualTo("https://flow/edit/flow-123");
        assertThat(varProps.get(FlowService.prop(FlowService.PROPERTY_HTTPROUTE), String.class)).isEqualTo("https://flow/route/{{id}}");
        assertThat(varProps.get(FlowService.prop(FlowService.PROPERTY_WEBSOCKETURL), String.class)).isEqualTo("wss://flow/ws");

        ValueMap contentProps = componentResource.getValueMap();
        assertThat(contentProps.get(FlowService.prop(FlowService.PROPERTY_ENABLE), Boolean.class)).isFalse();
        assertThat(contentProps.get(FlowService.prop(FlowService.PROPERTY_TITLE), String.class)).isEqualTo("Contact Flow");
        assertThat(contentProps.containsKey(FlowService.prop(FlowService.PROPERTY_FLOWSTREAMID))).isFalse();
        assertThat(contentProps.containsKey(FlowService.prop(FlowService.PROPERTY_EDITURL))).isFalse();
        assertThat(contentProps.containsKey(FlowService.prop(FlowService.PROPERTY_HTTPROUTE))).isFalse();
        assertThat(contentProps.containsKey(FlowService.prop(FlowService.PROPERTY_WEBSOCKETURL))).isFalse();
    }

    private static void inject(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
