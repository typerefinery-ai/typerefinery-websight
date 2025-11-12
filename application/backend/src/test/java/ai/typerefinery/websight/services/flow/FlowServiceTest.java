package ai.typerefinery.websight.services.flow;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;

import ai.typerefinery.websight.models.components.FlowComponent;

class FlowServiceTest {

    private static class TestableFlowService extends FlowService {
        FlowService.FlowComponentMetadata callResolve(FlowComponent component, String defaultGroup, String defaultName) {
            return resolveFlowComponentMetadata(component, defaultGroup, defaultName);
        }

        void callApply(ObjectNode node, FlowService.FlowComponentMetadata metadata) {
            applyFlowMetadata(node, metadata);
        }

        Map<String, Object> callApplyResponse(Map<String, Object> response, FlowService.FlowComponentMetadata metadata) {
            applyFlowMetadataToResponse(response, metadata);
            return response;
        }
    }

    @Test
    void resolveFlowComponentMetadata_prefersAuthoredValues() {
        FlowComponent component = new FlowComponent();
        component.flowapi_group = "custom-group";
        component.flowapi_name = "Custom Flow Name";
        component.flowapi_reference = "ref-123";
        component.flowapi_icon = "fa fa-rocket";
        component.flowapi_color = "#ff00ff";
        component.flowapi_version = "2.5.1";
        component.flowapi_author = "Flow Author";
        component.flowapi_readme = "## Extra notes";

        TestableFlowService service = new TestableFlowService();
        FlowService.FlowComponentMetadata metadata = service.callResolve(component, "default-group", "default-name");

        assertThat(metadata.getGroup()).isEqualTo("custom-group");
        assertThat(metadata.getName()).isEqualTo("Custom Flow Name");
        assertThat(metadata.getReference()).isEqualTo("ref-123");
        assertThat(metadata.getIcon()).isEqualTo("fa fa-rocket");
        assertThat(metadata.getColor()).isEqualTo("#ff00ff");
        assertThat(metadata.getVersion()).isEqualTo("2.5.1");
        assertThat(metadata.getAuthor()).isEqualTo("Flow Author");
        assertThat(metadata.getReadme()).isEqualTo("## Extra notes");
    }

    @Test
    void resolveFlowComponentMetadata_fallsBackToDefaultsWhenEmpty() {
        FlowComponent component = new FlowComponent();
        component.flowapi_group = null;
        component.flowapi_name = "";
        component.flowapi_reference = " ";
        component.flowapi_icon = " ";
        component.flowapi_color = null;
        component.flowapi_version = "";
        component.flowapi_author = "";
        component.flowapi_readme = null;

        TestableFlowService service = new TestableFlowService();
        FlowService.FlowComponentMetadata metadata = service.callResolve(component, "default-group", "default-name");

        assertThat(metadata.getGroup()).isEqualTo("default-group");
        assertThat(metadata.getName()).isEqualTo("default-name");
        assertThat(metadata.getReference()).isNull();
        assertThat(metadata.getIcon()).isNull();
        assertThat(metadata.getColor()).isNull();
        assertThat(metadata.getVersion()).isNull();
        assertThat(metadata.getAuthor()).isEqualTo(FlowService.FlowServiceConfiguration.FLOW_META_AUTHOR);
        assertThat(metadata.getReadme()).isNull();
    }

    @Test
    void applyFlowMetadata_populatesTemplateAndResponse() {
        FlowService.FlowComponentMetadata metadata = new FlowService.FlowComponentMetadata(
            "group-x",
            "Flow Name",
            "ref-321",
            "fa fa-code",
            "#123456",
            "1.0.0",
            "Author Name",
            "### Markdown"
        );

        TestableFlowService service = new TestableFlowService();

        ObjectNode template = JsonNodeFactory.instance.objectNode();
        service.callApply(template, metadata);

        assertThat(template.get(FlowService.PROPERTY_GROUP).asText()).isEqualTo("group-x");
        assertThat(template.get(FlowService.PROPERTY_NAME).asText()).isEqualTo("Flow Name");
        assertThat(template.get(FlowService.PROPERTY_AUTHOR).asText()).isEqualTo("Author Name");
        assertThat(template.get(FlowService.PROPERTY_REFERENCE).asText()).isEqualTo("ref-321");
        assertThat(template.get(FlowService.PROPERTY_ICON).asText()).isEqualTo("fa fa-code");
        assertThat(template.get(FlowService.PROPERTY_COLOR).asText()).isEqualTo("#123456");
        assertThat(template.get(FlowService.PROPERTY_VERSION).asText()).isEqualTo("1.0.0");
        assertThat(template.get(FlowService.PROPERTY_README).asText()).isEqualTo("### Markdown");

        Map<String, Object> response = new HashMap<>();
        service.callApplyResponse(response, metadata);

        assertThat(response)
            .containsEntry(FlowService.prop(FlowService.PROPERTY_GROUP), "group-x")
            .containsEntry(FlowService.prop(FlowService.PROPERTY_NAME), "Flow Name")
            .containsEntry(FlowService.prop(FlowService.PROPERTY_AUTHOR), "Author Name")
            .containsEntry(FlowService.prop(FlowService.PROPERTY_REFERENCE), "ref-321")
            .containsEntry(FlowService.prop(FlowService.PROPERTY_ICON), "fa fa-code")
            .containsEntry(FlowService.prop(FlowService.PROPERTY_COLOR), "#123456")
            .containsEntry(FlowService.prop(FlowService.PROPERTY_VERSION), "1.0.0")
            .containsEntry(FlowService.prop(FlowService.PROPERTY_README), "### Markdown");
    }
}

