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
import java.util.stream.Stream;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.RequestAttribute;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.jsoup.nodes.Element;
import org.jsoup.parser.Tag;

import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.models.components.DefaultGridComponent;
import io.typerefinery.websight.utils.GridDisplayType;
import io.typerefinery.websight.utils.GridStyle;
import io.typerefinery.websight.utils.LinkUtil;
import lombok.Getter;
import lombok.experimental.Delegate;
import lombok.extern.slf4j.Slf4j;
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
    @Inject
    @Getter
    @Default(values = "")
    private String flex;

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
            put("enabled", "flex");
        }
    };

    @Override
    @PostConstruct
    protected void init() {
        this.id = DEFAULT_ID;
        this.module = DEFAULT_MODULE;
        super.init();

        if (StringUtils.isNotBlank(flex)) {
            flex = flexConfig.getOrDefault(flex, "");
        }

        if (grid != null && style != null) {
            
            if (StringUtils.isNotBlank(flex)) {
                grid.addClasses(flex);
            }
            componentClasses = Arrays.stream(style.getClasses())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[]{});
        }

    }

}
