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
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.utils.ComponentUtil;
import io.typerefinery.websight.utils.ResourceUtils;
import lombok.Getter;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

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

    private static final Logger LOGGER = LoggerFactory.getLogger(Text.class);
    
    public static final String RESOURCE_TYPE = "typerefinery/components/content/text";

    public static final String PROPERTY_TEXT = "text";
    public static final String PROPERTY_PARAGRAPH_MODE = "paragraphMode";
    public static final String PROPERTY_PARAGRAPH_RESOURCETYPE = "paragraphResourceType";
    public static final String PROPERTY_THEME = "theme";
    public static final String PROPERTY_MARKDOWN = "markdown";
    
    public static final String DEFAULT_PARAGRAPH_RESOURCETYPE = "/apps/typerefinery/components/layout/container";
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
    
    private List<Map<String,Object>> paragraphs = new LinkedList<>();

    public List<Map<String,Object>> getParagraphs() {
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

        //split text into paragraphs
        if (isParagraphMode() && StringUtils.isNotBlank(text)) {
            Resource containerResource = resource.getResourceResolver().getResource(DEFAULT_PARAGRAPH_RESOURCETYPE);
            pl.ds.websight.components.core.api.Component containerResourceComponent = (pl.ds.websight.components.core.api.Component)containerResource.adaptTo(pl.ds.websight.components.core.api.Component.class);
            String[] paragraphsList = text.split(DEFAULT_PARAGRAPH_SPLIT);

            //add first placeholder
            String paraName = "par0";
            Resource child = resource.getChild(paraName);
            String relativeResourcePath = resource.getPath().substring(resourcePath.indexOf("jcr:content")).replace("jcr:content/", "");
            if (child == null) {                    
                try {
                    child = ComponentUtil.addComponent(request.getResourceResolver(), resource, containerResourceComponent, paraName);
                    ResourceUtils.markPageAsEdited(child);
                    request.getResourceResolver().commit();
                } catch (Exception e) {
                    e.printStackTrace();
                    LOGGER.error("Error creating paragraph", e);
                    this.text = "Error creating paragraph containers.";
                }
            }

            Map<String, Object> paragraphMap = new HashMap<>();
            paragraphMap.put("placeholder", ComponentUtil.getComponentPlacehodler(relativeResourcePath + "/" +paraName, "", containerResource));
            paragraphMap.put("resourceType", DEFAULT_PARAGRAPH_RESOURCETYPE);
            paragraphMap.put("name", "par0");
            paragraphMap.put("hasChildren", child.hasChildren());
            paragraphs.add(paragraphMap);

            // add all paragraphs
            for (int i = 0; i < paragraphsList.length; i++) {
                String paragraph = paragraphsList[i];
                paraName = "par" + (i+1);
                child = resource.getChild(paraName);
                
                if (child == null) {                    
                    try {
                        child = ComponentUtil.addComponent(request.getResourceResolver(), resource, containerResourceComponent, paraName);
                        ResourceUtils.markPageAsEdited(child);
                        request.getResourceResolver().commit();        
                    } catch (Exception e) {
                        e.printStackTrace();
                        LOGGER.error("Error creating paragraph", e);
                        this.text = "Error creating paragraph containers.";
                    }
                }

                paragraphMap = new HashMap<>();
                paragraphMap.put("text", paragraph);
                paragraphMap.put("placeholder", ComponentUtil.getComponentPlacehodler(relativeResourcePath + "/" +paraName, "", containerResource));
                paragraphMap.put("resourceType", DEFAULT_PARAGRAPH_RESOURCETYPE);
                paragraphMap.put("name", paraName);
                paragraphMap.put("hasChildren", child.hasChildren());
                paragraphs.add(paragraphMap);

            }

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