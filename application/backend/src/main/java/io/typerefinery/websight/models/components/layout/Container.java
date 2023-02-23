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
package io.typerefinery.websight.models.components.layout;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.text.MessageFormat;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.jsoup.nodes.Element;
import org.jsoup.parser.Tag;

import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.utils.LinkUtil;
import lombok.Getter;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.osgi.service.component.annotations.Component;
import java.util.HashMap;
import java.util.Map;

@Component
@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    resourceType = { 
        Container.RESOURCE_TYPE 
    }, 
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class Container extends BaseComponent {

    public static final String RESOURCE_TYPE = "typerefinery/components/layout/container";
    private static final String DEFAULT_ID = "container";
    private static final String DEFAULT_MODULE = "container";
    private static final String BACKGROUND_NONE = "none";
    private static final String BACKGROUND_URL_PATTERN = "url(\"%s\")";

    @SlingObject
    private ResourceResolver resourceResolver;

    // authored flex toggle
    // authored decoration tag name
    @Inject
    @Getter
    @Default(values = "")
    private String type;

    // authored flexEnabled toggle
    @Inject
    @Getter
    private Boolean flexEnabled;

    // bootstrap styling rowGap between children components
    @Inject
    @Getter
    @Default(values = "")
    private String rowGap;

    // bootstrap styling columnGap between children components
    @Inject
    @Getter
    @Default(values = "")
    private String columnGap;


    // bootstrap styling vertical alignment between children components
    @Inject
    @Getter
    @Default(values = "")
    private String verticalAlignment;

    // bootstrap styling horizontal alignment between children components
    @Inject
    @Getter
    @Default(values = "")
    private String horizontalAlignment;

    // background Image for the containers.
    @Inject
    private String backgroundImageSm;

    @Inject
    private String backgroundImageMd;

    @Inject
    private String backgroundImageLg;

    public String getBackgroundImageSm() {
        return getBackgroundImage(backgroundImageSm);
    }

    public String getBackgroundImageMd() {
        return getBackgroundImage(backgroundImageMd);
    }

    public String getBackgroundImageLg() {
        return getBackgroundImage(backgroundImageLg);
    }

    private String getBackgroundImage(String image) {
        if (StringUtils.isEmpty(image)) {
            return BACKGROUND_NONE;
        }

        return String.format(BACKGROUND_URL_PATTERN, LinkUtil.handleLink(image, resourceResolver));
    }

    public String getOpenTag() {
        Element htmlTag = new Element(Tag.valueOf(decorationTagName), "");

        htmlTag.attr("id", this.id);

        if (StringUtils.isNotBlank(getComponentClassNames())) {
            htmlTag.attr("class", getComponentClassNames());
        }
            
        if (StringUtils.isNotBlank(backgroundImageSm) && StringUtils.isNotBlank(backgroundImageMd) &&  StringUtils.isNotBlank(backgroundImageLg)) {
            htmlTag.attr("style", MessageFormat.format("--bg-image-sm:{2};--height-sm:auto;--bg-image-md: {3};--height-md:auto;--bg-image-lg:{4};--height-lg:auto;", backgroundImageSm, backgroundImageMd, backgroundImageLg));
            
        }
                                                    
        return htmlTag.toString().replace(getCloseTag(), "");        
    }

    public String getCloseTag() {
        return "</" + decorationTagName + ">";
    }

    @Override
    public String[] getClasses() {
        return componentClasses;
    }

    private Map<String, String> flexConfig = new HashMap<String, String>() {
        {
            put("enabled", "row");
            put("default", "");
        }
    };

    private Map<String, String> verticalAlignmentConfig = new HashMap<String, String>() {
        {
            put("start", "align-items-start");
            put("center", "align-items-center");
            put("end", "align-items-end");
        }
    };

    private Map<String, String> horizontalAlignmentConfig = new HashMap<String, String>() {
        {
            put("start", "justify-content-start");
            put("center", "justify-content-center");
            put("end", "justify-content-end");
            put("around", "justify-content-around");
            put("evenly", "justify-content-evenly");
            put("between", "justify-content-between");
        }
    };

    @Override
    @PostConstruct
    protected void init() {
        this.id = DEFAULT_ID;
        this.module = DEFAULT_MODULE;
        super.init();

        String flex = "";

        if (BooleanUtils.isTrue(flexEnabled)) {
            flex = flexConfig.getOrDefault("enabled", "");
        }else {
            flex = flexConfig.getOrDefault("default", "");
        }

        if (grid != null && style != null) {
            
            grid.addClasses(flex);
            
            if (StringUtils.isBlank(columnGap) && StringUtils.isBlank(rowGap)) {
                grid.addClasses("gap-1");
            } else {
                if (StringUtils.isNotBlank(columnGap)) {
                    grid.addClasses("column-gap-" + columnGap);
                }
                if (StringUtils.isNotBlank(rowGap)) {
                    grid.addClasses("row-gap-" + rowGap);
                }
            }

            if (StringUtils.isNotBlank(horizontalAlignment)) {
                grid.addClasses(horizontalAlignmentConfig.getOrDefault(horizontalAlignment, ""));
            }else {
                grid.addClasses("center");
            }
            if (StringUtils.isNotBlank(verticalAlignment)) {
                grid.addClasses(verticalAlignmentConfig.getOrDefault(verticalAlignment, ""));
            } else {
                grid.addClasses("evenly");
            }

            componentClasses = Arrays.stream(style.getClasses())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[]{});
        }

    }

}
