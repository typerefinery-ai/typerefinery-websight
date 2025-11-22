package ai.typerefinery.websight.services.flow;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.lang.annotation.Annotation;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import javax.net.ssl.SSLSession;

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

    private static class PauseTestFlowService extends FlowService {
        private HttpRequest capturedRequest;
        private HttpResponse<String> responseToReturn;
        private IOException ioException;
        private InterruptedException interruptedException;

        void initialise(FlowServiceConfiguration configuration) {
            activate(configuration);
        }

        void setResponse(HttpResponse<String> response) {
            this.responseToReturn = response;
        }

        void setIOException(IOException ioException) {
            this.ioException = ioException;
        }

        void setInterruptedException(InterruptedException interruptedException) {
            this.interruptedException = interruptedException;
        }

        HttpRequest getCapturedRequest() {
            return this.capturedRequest;
        }

        @Override
        protected HttpResponse<String> executeFlowPauseRequest(HttpRequest request) throws IOException, InterruptedException {
            this.capturedRequest = request;
            if (this.ioException != null) {
                throw this.ioException;
            }
            if (this.interruptedException != null) {
                throw this.interruptedException;
            }
            return this.responseToReturn;
        }
    }

    private static class TestHttpResponse implements HttpResponse<String> {
        private final int statusCode;
        private final String body;
        private final HttpRequest request;

        TestHttpResponse(int statusCode, String body, HttpRequest request) {
            this.statusCode = statusCode;
            this.body = body;
            this.request = request;
        }

        @Override
        public int statusCode() {
            return this.statusCode;
        }

        @Override
        public HttpRequest request() {
            return this.request;
        }

        @Override
        public Optional<HttpResponse<String>> previousResponse() {
            return Optional.empty();
        }

        @Override
        public HttpHeaders headers() {
            return HttpHeaders.of(Collections.emptyMap(), (header, value) -> true);
        }

        @Override
        public String body() {
            return this.body;
        }

        @Override
        public Optional<SSLSession> sslSession() {
            return Optional.empty();
        }

        @Override
        public URI uri() {
            return this.request.uri();
        }

        @Override
        public HttpClient.Version version() {
            return HttpClient.Version.HTTP_1_1;
        }
    }

    private static class TestFlowConfiguration implements FlowService.FlowServiceConfiguration {
        @Override
        public String host_url() {
            return FlowService.FlowServiceConfiguration.FLOW_HOST;
        }

        @Override
        public String host_url_client() {
            return FlowService.FlowServiceConfiguration.FLOW_HOST_CLIENT;
        }

        @Override
        public String endpoint_export() {
            return FlowService.FlowServiceConfiguration.FLOW_ENDPOINT_EXPORT;
        }

        @Override
        public String endpoint_read() {
            return FlowService.FlowServiceConfiguration.FLOW_ENDPOINT_READ;
        }

        @Override
        public String endpoint_import() {
            return FlowService.FlowServiceConfiguration.FLOW_ENDPOINT_IMPORT;
        }

        @Override
        public String endpoint_update() {
            return FlowService.FlowServiceConfiguration.FLOW_ENDPOINT_UPDATE;
        }

        @Override
        public String endpoint_design_save() {
            return FlowService.FlowServiceConfiguration.FLOW_ENDPOINT_DESIGN_SAVE;
        }

        @Override
        public String endpoint_design() {
            return FlowService.FlowServiceConfiguration.FLOW_ENDPOINT_DESIGN;
        }

        @Override
        public String endpoint_client() {
            return FlowService.FlowServiceConfiguration.FLOW_ENDPOINT_CLIENT;
        }

        @Override
        public String endpoint_streams_pause() {
            return FlowService.FlowServiceConfiguration.FLOW_ENDPOINT_STREAMS_PAUSE;
        }

        @Override
        public String endpoint_streams_save() {
            return FlowService.FlowServiceConfiguration.FLOW_ENDPOINT_STREAMS_SAVE;
        }

        @Override
        public String flow_ws_url() {
            return FlowService.FlowServiceConfiguration.FLOW_WS_URL;
        }

        @Override
        public String flow_designer_url() {
            return FlowService.FlowServiceConfiguration.FLOW_DESIGNER_URL;
        }

        @Override
        public String flow_tms_url() {
            return FlowService.FlowServiceConfiguration.FLOW_TMS_URL;
        }

        @Override
        public boolean flow_page_change_listener_enabled() {
            return FlowService.FlowServiceConfiguration.FLOW_PAGE_CHNAGE_LISTENER_ENABLE;
        }

        @Override
        public String flow_meta_author() {
            return FlowService.FlowServiceConfiguration.FLOW_META_AUTHOR;
        }

        @Override
        public Class<? extends Annotation> annotationType() {
            return FlowService.FlowServiceConfiguration.class;
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

    @Test
    void toggleFlowStreamPause_buildsCorrectUrlAndReturnsSuccess() {
        PauseTestFlowService service = new PauseTestFlowService();
        service.initialise(new TestFlowConfiguration());
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:8000/fapi/streams_pause/flow-123?is=1"))
            .GET()
            .build();
        service.setResponse(new TestHttpResponse(200, "", request));

        FlowService.FlowPauseResult result = service.toggleFlowStreamPause("flow-123", true);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.isPauseRequested()).isTrue();
        assertThat(service.getCapturedRequest().uri().toString()).isEqualTo("http://localhost:8000/fapi/streams_pause/flow-123?is=1");
        assertThat(service.getCapturedRequest().method()).isEqualTo("GET");
    }

    @Test
    void toggleFlowStreamPause_handlesIOException() {
        PauseTestFlowService service = new PauseTestFlowService();
        service.initialise(new TestFlowConfiguration());
        service.setIOException(new IOException("network failure"));

        FlowService.FlowPauseResult result = service.toggleFlowStreamPause("flow-987", false);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.isPauseRequested()).isFalse();
        assertThat(result.getMessage()).contains("network failure");
        assertThat(service.getCapturedRequest().uri().toString()).isEqualTo("http://localhost:8000/fapi/streams_pause/flow-987?is=0");
    }
}

