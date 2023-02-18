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

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.RequestAttribute;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.utils.LinkUtil;
import lombok.Getter;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.osgi.service.component.annotations.Component;
import java.util.HashMap;
import java.util.Map;

@Component
@Model(adaptables = Resource.class, resourceType = { Container.RESOURCE_TYPE }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class Container extends BaseComponent {

    public static final String RESOURCE_TYPE = "typerefinery/components/layout/container";
    private static final String DEFAULT_ID = "container_";
    private static final String DEFAULT_MODULE = "container_";
    private static final String BACKGROUND_NONE = "none";
    private static final String BACKGROUND_URL_PATTERN = "url(\"%s\")";

    @RequestAttribute(name = "decorationTagName")
    @Default(values = "")
    private String decorationTagName;

    @SlingObject
    private ResourceResolver resourceResolver;

    @Inject
    @Getter
    @Default(values = "")
    private String type;

    @Inject
    @Getter
    @Default(values = "")
    private String rowGap;

    @Inject
    @Getter
    @Default(values = "")
    private String columnGap;

    @Inject
    @Getter
    @Default(values = "")
    private Boolean flexEnabled;

    @Inject
    @Getter
    @Default(values = "")
    private String verticalAlignment;

    @Inject
    @Getter
    @Default(values = "")
    private String horizontalAlignment;

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

    @Override
    public String[] getClasses() {
        return componentClasses;
    }

    public String getDecorationTagName() {
        return decorationTagName;
    }

    private Map<String, String> flexConfig = new HashMap<String, String>() {
        {
            put("flexEnabled", "grid");
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
            put("space-around", "justify-content-around");
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

        if (grid != null && style != null) {

            if (StringUtils.isBlank(columnGap) && StringUtils.isBlank(rowGap)) {

                grid.addClasses("gap-3");
            } else {
                if (StringUtils.isNotBlank(columnGap)) {
                    grid.addClasses("column-gap-" + columnGap);
                }
                if (StringUtils.isNotBlank(rowGap)) {
                    grid.addClasses("row-gap-" + rowGap);
                }
            }

            if (BooleanUtils.isTrue(flexEnabled)) {
                grid.addClasses(flexConfig.get("flexEnabled"));
            }
            if (StringUtils.isNotBlank(horizontalAlignment)) {
                grid.addClasses(horizontalAlignmentConfig.getOrDefault(horizontalAlignment, ""));
            }
            if (StringUtils.isNotBlank(verticalAlignment)) {
                grid.addClasses(verticalAlignmentConfig.getOrDefault(verticalAlignment, ""));
            }
            grid.addClasses(horizontalAlignmentConfig.get(""));
            componentClasses = Arrays.stream(style.getClasses())
                    .collect(Collectors.toCollection(LinkedHashSet::new))
                    .toArray(new String[] {});
        }

        if (StringUtils.isBlank(decorationTagName)) {
            decorationTagName = "div";
        }

        if (StringUtils.isNotBlank(type)) {
            decorationTagName = type;
        }
    }

}
