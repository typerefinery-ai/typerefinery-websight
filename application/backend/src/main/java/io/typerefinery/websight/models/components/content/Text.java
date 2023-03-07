/*
 * Copyright (C) 2023 Typerefinery.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package io.typerefinery.websight.models.components.content;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.jetbrains.annotations.Nullable;

import io.typerefinery.websight.models.components.BaseComponent;
import lombok.Getter;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import org.commonmark.node.*;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    resourceType = { Text.RESOURCE_TYPE },
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class Text extends BaseComponent {

    
    public static final String RESOURCE_TYPE = "typerefinery/components/content/text";

    public static final String PROPERTY_TEXT = "text";
    public static final String PROPERTY_PARAGRAPH_MODE = "paragraphMode";
    public static final String PROPERTY_PARAGRAPH_RESOURCETYPE = "paragraphResourceType";
    public static final String PROPERTY_THEME = "theme";
    public static final String PROPERTY_MARKDOWN = "markdown";
    
    public static final String DEFAULT_PARAGRAPH_RESOURCETYPE = "typerefinery/components/layout/container";
    public static final String DEFAULT_PARAGRAPH_SPLIT = "(?=(<p>|<h1>|<h2>|<h3>|<h4>|<h5>|<h6>))";
    public static final String DEFAULT_TEXT = "Rich Text";

    @Getter
    @Inject
    @Named(PROPERTY_TEXT)
    @Nullable
    private String text;
    
    @Getter
    @Inject
    @Named(PROPERTY_PARAGRAPH_MODE)
    @Nullable
    private String paragraphMode;

    @Getter
    @Inject
    @Named(PROPERTY_PARAGRAPH_RESOURCETYPE)
    @Nullable
    private String paragraphResourceType;
    
    @Getter
    @Inject
    @Named(PROPERTY_THEME)
    @Nullable
    private String theme;
        
    @Getter
    @Inject
    @Named(PROPERTY_MARKDOWN)
    @Nullable
    private String markdown;
    
    private String[] paragraphs = new String[0];

    public String[] getParagraphs() {
        return paragraphs;
    }

    public Boolean isParagraphMode() {
        return "true".equals(paragraphMode);
    }

    private Map<String, String> themeConfig = new HashMap<String, String>(){{
        put("checked", "hl-rich-text--checked-bullet-points");
    }};

    @Override
    @PostConstruct
    protected void init() {
        super.init();

        style.addClasses(themeConfig.getOrDefault(theme, ""));

        //TODO: disabled to do https://github.com/websight-io/starter/issues/142
        //split text into paragraphs
        if (isParagraphMode() && StringUtils.isNotBlank(text)) {
            paragraphs = text.split(DEFAULT_PARAGRAPH_SPLIT);
        }

        if (StringUtils.isNotBlank(markdown)) {
            Parser parser = Parser.builder().build();
            Node document = parser.parse(markdown);
            HtmlRenderer renderer = HtmlRenderer.builder().build();
            text = renderer.render(document);
        }

        if (StringUtils.isBlank(text)) {
            text = DEFAULT_TEXT;
        }
        
    }


}