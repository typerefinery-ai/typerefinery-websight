package ai.typerefinery.websight.models.components.widgets;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;


import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;

import ai.typerefinery.websight.models.components.BaseComponent;


@Model(adaptables = Resource.class, resourceType = { "typerefinery/components/widgets/editor" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { 
    @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false") 
})
public class Editor extends BaseComponent {
    

    
    private static final String DEFAULT_WEBSOCKET_HOST = "ws://localhost:8112/$tms";
    private static final String DEFAULT_VARIANT = "CODE_EDITOR";
    private static final String DEFAULT_CODE_EDITOR = "CODEMIRROR";
    private static final String DEFAULT_EDITOR_THEME = "light";
    private static final String DEFAULT_EDITOR_LANGUAGE_STRING = "javascript";
    private static final String DEFAULT_MARGIN_CLASS = "mb-3";


    @Getter
    @Inject
    public String dataSource;

    @Getter
    @Inject
    public String websocketHost;

    @Getter
    @Inject
    public String websocketTopic;

    @Getter
    @Inject
    public String variant;


    @Getter
    @Inject
    public String codeEditor;

    @Getter
    @Inject
    public String editorTheme;

    @Getter
    @Inject
    public String editorLanguage;

    
    @Getter
    @Inject
    public String placeholder;



    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (StringUtils.isBlank(websocketHost)) {
            this.websocketHost = DEFAULT_WEBSOCKET_HOST;
        }

        if (StringUtils.isBlank(variant)) {
            this.variant = DEFAULT_VARIANT;
        }

        if (StringUtils.isBlank(codeEditor)) {
            this.codeEditor = DEFAULT_CODE_EDITOR;
        }

        if (StringUtils.isBlank(editorTheme)) {
            this.editorTheme = DEFAULT_EDITOR_THEME;
        }

        if (StringUtils.isBlank(editorLanguage)) {
            this.editorLanguage = DEFAULT_EDITOR_LANGUAGE_STRING;
        }

        

        grid.addClasses(DEFAULT_MARGIN_CLASS);
    }
}
