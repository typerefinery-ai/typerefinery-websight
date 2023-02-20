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

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import lombok.Getter;
import lombok.experimental.Delegate;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.jetbrains.annotations.Nullable;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.models.components.DefaultStyledGridComponent;
import io.typerefinery.websight.models.components.layout.Grid;
import io.typerefinery.websight.models.components.layout.Styled;

import org.apache.sling.api.SlingHttpServletRequest;

import javax.inject.Inject;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class Title extends BaseComponent {

    private static final String OPTION_TITLE = "title";
    private static final String OPTION_HEADING_LEVEL = "headingLevel";
    private static final String OPTION_HEADING_SIZE = "headingSize";
    private static final String OPTION_SHOW_SUBTITLE = "showSubtitle";
    private static final String OPTION_SUBTITLE = "subtitle";

    private static final String DEFAULT_TITLE = "Add your heading here";
    private static final String DEFAULT_HEADING_LEVEL = "h2";
    private static final String DEFAULT_HEADING_SIZE = "hl-title__heading--size-4";
    private static final String DEFAULT_SUBTITLE = "Add your text here";
    private static final Boolean DEFAULT_SHOW_SUBTITLE = false;

    @Inject
    @Named(OPTION_TITLE)
    @Getter
    @Nullable
    private String title;

    @Inject
    @Named(OPTION_HEADING_LEVEL)
    @Getter
    @Nullable
    private String headingLevel;

    @Inject
    @Named(OPTION_HEADING_SIZE)
    @Getter
    @Nullable
    private String headingSize;

    @Inject
    @Named(OPTION_SHOW_SUBTITLE)
    @Getter
    @Nullable
    private Boolean showSubtitle;

    @Inject
    @Named(OPTION_SUBTITLE)
    @Getter
    @Nullable
    private String subtitle;

    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (title == null) {
            title = DEFAULT_TITLE;
        }

        if (headingLevel == null) {
            headingLevel = DEFAULT_HEADING_LEVEL;
        }

        if (headingSize == null) {
            headingSize = DEFAULT_HEADING_SIZE;
        }

        if (showSubtitle == null) {
            showSubtitle = DEFAULT_SHOW_SUBTITLE;
        }

        if (subtitle == null) {
            subtitle = DEFAULT_SUBTITLE;
        }
        
    }
}
