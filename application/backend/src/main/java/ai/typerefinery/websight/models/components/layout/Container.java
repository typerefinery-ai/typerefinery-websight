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
package ai.typerefinery.websight.models.components.layout;

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

import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.utils.FakeRequest;
import ai.typerefinery.websight.utils.FakeResponse;
import ai.typerefinery.websight.utils.LinkUtil;
import ai.typerefinery.websight.utils.PageUtil;
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

    // authored flexEnabled toggle
    @Inject
    @Getter
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

    // bootstrap styling for border to seperate from other container
    @Inject
    @Getter
    @Default(values = "")
    private Boolean borderEnabled;

    @Inject
    @Getter
    @Default(values = "")
    private String borderColor;

    @Inject
    @Getter
    @Default(values = "")
    private String borderWidth;

    @Inject
    @Getter
    @Default(values = "")
    private String borderRadius;

    @Inject
    @Getter
    @Default(values = "")
    private Boolean borderPositionTop;

    @Inject
    @Getter
    @Default(values = "")
    private Boolean borderPositionBottom;

    @Inject
    @Getter
    @Default(values = "")
    private Boolean borderPositionRight;

    @Inject
    @Getter
    @Default(values = "")
    private Boolean borderPositionLeft;

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

    // bootstrap padding for the containers.
    @Inject
    @Getter
    @Default(values = "")
    private Boolean paddingEnabled;

    @Inject
    @Getter
    @Default(values = "")
    private String paddingGeneral;

    @Inject
    @Getter
    @Default(values = "")
    private String paddingTop;

    @Inject
    @Getter
    @Default(values = "")
    private String paddingBottom;

    @Inject
    @Getter
    @Default(values = "")
    private String paddingLeft;

    @Inject
    @Getter
    @Default(values = "")
    private String paddingRight;

    // bootstrap margin for the containers.
    @Inject
    @Getter
    @Default(values = "")
    private Boolean marginEnabled;

    @Inject
    @Getter
    @Default(values = "")
    private String marginGeneral;

    @Inject
    @Getter
    @Default(values = "")
    private String marginTop;

    @Inject
    @Getter
    @Default(values = "")
    private String marginBottom;

    @Inject
    @Getter
    @Default(values = "")
    private String marginLeft;

    @Inject
    @Getter
    @Default(values = "")
    private String marginRight;


    // background Color for the containers.
    @Inject
    @Getter
    @Default(values = "")
    private String backgroundColor;

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
            put("baseline", "align-items-baseline");
            put("flex-start", "align-items-flex-start");
            put("flex-end", "align-items-flex-end");
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
    private Map<String, String> borderColorConfig = new HashMap<String, String>() {
        {
            put("primary", "border-primary");
            put("secondary", "border-secondary");
            put("success", "border-success");
            put("light", "border-light");
            put("dark", "border-dark");
            put("danger", "border-danger");
        }
    };

    private Map<String, String> borderWidthConfig = new HashMap<String, String>() {
        {
            put("one", "border-1");
            put("two", "border-2");
            put("three", "border-3");
            put("four", "border-4");
            put("five", "border-5");
        }
    };
    private Map<String, String> paddingGeneralConfig = new HashMap<String, String>() {
        {
            put("zero", "p-0");
            put("one", "p-1");
            put("two", "p-2");
            put("three", "p-3");
            put("four", "p-4");
            put("five", "p-5");
        }
    };

    private Map<String, String> paddingTopConfig = new HashMap<String, String>() {
        {
            put("zero", "pt-0");
            put("one", "pt-1");
            put("two", "pt-2");
            put("three", "pt-3");
            put("four", "pt-4");
            put("five", "pt-5");
        }
    };

    private Map<String, String> paddingBottomConfig = new HashMap<String, String>() {
        {
            put("zero", "pb-0");
            put("one", "pb-1");
            put("two", "pb-2");
            put("three", "pb-3");
            put("four", "pb-4");
            put("five", "pb-5");
        }
    };

    private Map<String, String> paddingRightConfig = new HashMap<String, String>() {
        {
            put("zero", "pe-0");
            put("one", "pe-1");
            put("two", "pe-2");
            put("three", "pe-3");
            put("four", "pe-4");
            put("five", "pe-5");
        }
    };

    private Map<String, String> paddingLeftConfig = new HashMap<String, String>() {
        {
            put("zero", "ps-0");
            put("one", "ps-1");
            put("two", "ps-2");
            put("three", "ps-3");
            put("four", "ps-4");
            put("five", "ps-5");
        }
    };


    private Map<String, String> marginGeneralConfig = new HashMap<String, String>() {
        {
            put("zero", "m-0");
            put("one", "m-1");
            put("two", "m-2");
            put("three", "m-3");
            put("four", "m-4");
            put("five", "m-5");
        }
    };

    private Map<String, String> marginTopConfig = new HashMap<String, String>() {
        {
            put("zero", "mt-0");
            put("one", "mt-1");
            put("two", "mt-2");
            put("three", "mt-3");
            put("four", "mt-4");
            put("five", "mt-5");
        }
    };

    private Map<String, String> marginBottomConfig = new HashMap<String, String>() {
        {
            put("zero", "mb-0");
            put("one", "mb-1");
            put("two", "mb-2");
            put("three", "mb-3");
            put("four", "mb-4");
            put("five", "mb-5");
        }
    };

    private Map<String, String> marginLeftConfig = new HashMap<String, String>() {
        {
            put("zero", "ms-0");
            put("one", "ms-1");
            put("two", "ms-2");
            put("three", "ms-3");
            put("four", "ms-4");
            put("five", "ms-5");
        }
    };

    private Map<String, String> marginRightConfig = new HashMap<String, String>() {
        {
            put("zero", "me-0");
            put("one", "me-1");
            put("two", "me-2");
            put("three", "me-3");
            put("four", "me-4");
            put("five", "me-5");
        }
    };

    private Map<String, String> borderRadiusConfig = new HashMap<String, String>() {
        {
            put("rounded", "rounded");
            put("roundedTop", "rounded-top");
            put("roundedBottom", "rounded-bottom");
            put("roundedLeft", "rounded-right");
            put("roundedCircle", "rounded-left");
            put("five", "rounded-circle");
        }
    };
    
    private Map<String, String> backgroundColorConfig = new HashMap<String, String>() {
        {
            put("primary", "p-3 bg-primary");
            put("secondary", "p-3 bg-secondary");
            put("success", "p-3 bg-success");
            put("light", "p-3 bg-light");
            put("dark", "p-3 bg-dark");
            put("danger", "p-3 bg-danger");
        }
    };

    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();

        String flex = "";

        if(containerType == "fullWidth") {
            grid.addClasses("container-fluid");
        }else if(containerType == "defaultPadding" && BooleanUtils.isFalse(flexEnabled)) {
            grid.addClasses("container");   
        } 
        // grid.addClasses("m-auto");

        if(BooleanUtils.isTrue(borderPositionTop)) {
            grid.addClasses("border-top");
        }

        if(BooleanUtils.isTrue(borderPositionBottom)) {
            grid.addClasses("border-bottom");
        }

        if(BooleanUtils.isTrue(borderPositionRight)) {
            grid.addClasses("border-end");
        }

        if(BooleanUtils.isTrue(borderPositionLeft)) {
            grid.addClasses("border-start");
        }

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
                grid.addClasses("gap-" + columnGap);
                grid.addClasses("gap-" + rowGap);
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

            if (StringUtils.isNotBlank(backgroundColor)) {
                grid.addClasses(backgroundColorConfig.getOrDefault(backgroundColor, ""));
            }

            componentClasses = Arrays.stream(style.getClasses())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[]{});
        }

        // bootstrap border styling
        if (BooleanUtils.isTrue(borderEnabled)) {   

            if (StringUtils.isNotBlank(borderColor)) {
                grid.addClasses(borderColorConfig.getOrDefault(borderColor, ""));
            }
            if (StringUtils.isNotBlank(borderWidth)) {
                grid.addClasses(borderWidthConfig.getOrDefault(borderWidth, ""));
            } 
            if (StringUtils.isNotBlank(borderRadius)) {
                grid.addClasses(borderRadiusConfig.getOrDefault(borderRadius, ""));
            } 

            componentClasses = Arrays.stream(style.getClasses())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[]{});
        }

        //bootstrap margin styling
        if (BooleanUtils.isTrue(marginEnabled)) {   

            if (StringUtils.isNotBlank(marginGeneral)) {
                grid.addClasses(marginGeneralConfig.getOrDefault(marginGeneral, ""));
            }
            if (StringUtils.isNotBlank(marginTop)) {
                grid.addClasses(marginTopConfig.getOrDefault(marginTop, ""));
            } 
            if (StringUtils.isNotBlank(marginBottom)) {
                grid.addClasses(marginBottomConfig.getOrDefault(marginBottom, ""));
            } 
            if (StringUtils.isNotBlank(marginLeft)) {
                grid.addClasses(marginLeftConfig.getOrDefault(marginLeft, ""));
            } 
            if (StringUtils.isNotBlank(marginRight)) {
                grid.addClasses(marginRightConfig.getOrDefault(marginRight, ""));
            } 

            componentClasses = Arrays.stream(style.getClasses())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[]{});
        }

        //bootstrap margin styling
        if (BooleanUtils.isTrue(paddingEnabled)) {   

            if (StringUtils.isNotBlank(paddingGeneral)) {
                grid.addClasses(paddingGeneralConfig.getOrDefault(paddingGeneral, ""));
            }
            if (StringUtils.isNotBlank(paddingTop)) {
                grid.addClasses(paddingTopConfig.getOrDefault(paddingTop, ""));
            } 
            if (StringUtils.isNotBlank(paddingBottom)) {
                grid.addClasses(paddingBottomConfig.getOrDefault(paddingBottom, ""));
            } 
            if (StringUtils.isNotBlank(paddingLeft)) {
                grid.addClasses(paddingLeftConfig.getOrDefault(paddingLeft, ""));
            } 
            if (StringUtils.isNotBlank(paddingRight)) {
                grid.addClasses(paddingRightConfig.getOrDefault(paddingRight, ""));
            } 

            componentClasses = Arrays.stream(style.getClasses())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[]{});
        }
        //background color
        if (StringUtils.isNotBlank(backgroundColor)) {
            grid.addClasses(backgroundColorConfig.getOrDefault(backgroundColor, ""));
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
