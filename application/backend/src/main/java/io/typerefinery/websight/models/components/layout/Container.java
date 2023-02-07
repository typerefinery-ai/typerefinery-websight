/*
 * Copyright (C) 2022 Typerefinery.io
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

import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.models.components.DefaultGridComponent;
import io.typerefinery.websight.utils.GridDisplayType;
import io.typerefinery.websight.utils.GridStyle;
import io.typerefinery.websight.utils.LinkUtil;
import lombok.experimental.Delegate;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Model(adaptables = {Resource.class, SlingHttpServletRequest.class}, defaultInjectionStrategy = OPTIONAL)
public class Container extends BaseComponent implements Grid {

    private static final String BACKGROUND_NONE = "none";
    private static final String BACKGROUND_URL_PATTERN = "url(\"%s\")";

    @RequestAttribute(name = "decorationTagName")
    @Default(values = "div")
    private String decorationTagName;

    @SlingObject
    private ResourceResolver resourceResolver;

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

    @Self
    @Delegate
    private DefaultGridComponent grid;

    @Override
    public String[] getClasses() {
        return componentClasses;
    }
    
    public String getDecorationTagName() {
        return decorationTagName;
    }

    // @Override
    @PostConstruct
    protected void init() {
        super.init();

        grid = resource.adaptTo(DefaultGridComponent.class);
        
        if (grid != null && this.getStyle() != null) {
            componentClasses = Stream.concat(
                Arrays.stream(this.getStyle().getClasses()),
                new GridStyle(this, GridDisplayType.GRID).getClasses().stream())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[]{});
        }
    }

}
