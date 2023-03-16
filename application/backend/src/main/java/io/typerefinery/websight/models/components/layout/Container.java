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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.text.MessageFormat;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.engine.SlingRequestProcessor;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.jetbrains.annotations.Nullable;
import org.jsoup.nodes.Element;
import org.jsoup.parser.Tag;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.utils.FakeRequest;
import io.typerefinery.websight.utils.FakeResponse;
import io.typerefinery.websight.utils.LinkUtil;
import io.typerefinery.websight.utils.PageUtil;
import lombok.Getter;
import pl.ds.websight.pages.foundation.WcmMode;

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

    private static final Logger LOGGER = LoggerFactory.getLogger(Container.class);

    public static final String RESOURCE_TYPE = "typerefinery/components/layout/container";
    private static final String DEFAULT_MODULE = "container";
    private static final String BACKGROUND_NONE = "none";
    private static final String BACKGROUND_URL_PATTERN = "url(\"%s\")";

    public static final String PROPERTY_CANCEL_INHERIT_FROM_PARENT = "cancelInheritParent";
    public static final String PROPERTY_INHERITING = "inheriting";

    @OSGiService
    private SlingRequestProcessor requestProcessor;

    @SlingObject
    private ResourceResolver resourceResolver;

    // does the container inherit from parent container
    @Inject
    @Getter
    @Named(PROPERTY_INHERITING)
    @Default(values = "false")
    protected Boolean inheriting;

    // does the container cancel inherit from parent container
    @Inject
    @Getter
    @Named(PROPERTY_CANCEL_INHERIT_FROM_PARENT)
    @Nullable
    protected String cancelInheritParent;

    @Getter
    protected Resource inheritedResource;

    @Getter
    protected String wcmmodeName = WcmMode.class.getName();

    // authored flex toggle
    // authored decoration tag name
    @Inject
    @Getter
    @Default(values = "")
    private String type;

    @Inject
    @Getter
    @Default(values = "")
    private String containerType;

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

    public String getInlineStyleValue() {
        if (StringUtils.isNotBlank(backgroundImageSm) && StringUtils.isNotBlank(backgroundImageMd) && StringUtils.isNotBlank(backgroundImageLg)) {
            return MessageFormat.format("--bg-image-sm:{0};--height-sm:auto;--bg-image-md:{1};--height-md:auto;--bg-image-lg:{2};--height-lg:auto;", backgroundImageSm, backgroundImageMd, backgroundImageLg);
        }
        return "";
    }

    public String getOpenTag() {
        Element htmlTag = new Element(Tag.valueOf(decorationTagName), "");

        htmlTag.attr("id", this.id);

        if (StringUtils.isNotBlank(getComponentClassNames())) {
            htmlTag.attr("class", getComponentClassNames());
        }
            
        if (StringUtils.isNotBlank(backgroundImageSm) && StringUtils.isNotBlank(backgroundImageMd) &&  StringUtils.isNotBlank(backgroundImageLg)) {
            htmlTag.attr("style", getInlineStyleValue());
            
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
            put("enabled", "row container-fluid");
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
        this.module = DEFAULT_MODULE;
        super.init();

        String flex = "";

        if(containerType.equals("fullWidth")) {
            grid.addClasses("container-fluid");
        }else if(containerType.equals("defaultPadding") && BooleanUtils.isNotTrue(flexEnabled)) {
            grid.addClasses("container"); 
        }
        // grid.addClasses("m-auto");

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
                grid.addClasses("column-gap-" + columnGap);
                grid.addClasses("row-gap-" + rowGap);
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

        // if this component is set as inheriting and is not cancel inherit from parent, find inheritedResource
        if (inheriting) {
            if (!BooleanUtils.toBoolean(cancelInheritParent)) {
                inheritedResource = PageUtil.findInheritedResource(resource);
            }
        }

    
    }

    public String getInheritedHtml() {
        if (inheritedResource == null) {
            LOGGER.debug("No inherited resource found for {}", resource.getPath());
            return "";
        }
        try {
            String markup = "";
            String url = inheritedResource.getPath() + ".html";

            HttpServletRequest req = new FakeRequest("GET", url);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            HttpServletResponse resp;
            try {
                resp = new FakeResponse(out);

                // this needs to be done to get the inherited resource
                requestProcessor.processRequest(req, resp, resourceResolver);

                // need to flush the response to get the contents
                resp.getWriter().flush();

                // trim to remove all the extra whitespace
                markup = out.toString().trim();

            } catch (ServletException | IOException | NoSuchAlgorithmException e) {
                LOGGER.warn("Exception retrieving contents for {}", url, e);
            }
            
            return markup;
        } catch (Exception e) {
            LOGGER.error("Error getting inherited html", e);
        }
        return "";
    }

}
