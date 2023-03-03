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
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.jetbrains.annotations.Nullable;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.utils.PageUtil;

import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.vault.util.JcrConstants;
import org.apache.sling.api.SlingHttpServletRequest;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class Title extends BaseComponent {

    private static final String PROPERTY_TITLE = "title";
    private static final String PROPERTY_HEADING_LEVEL = "headingLevel";
    private static final String PROPERTY_HEADING_SIZE = "headingSize";

    private static final String DEFAULT_TITLE = "Add your heading here";
    private static final String DEFAULT_HEADING_LEVEL = "h2";

    @Inject
    @Named(PROPERTY_TITLE)
    @Getter
    @Nullable
    private String title;

    @Inject
    @Named(PROPERTY_HEADING_LEVEL)
    @Getter
    @Nullable
    private String headingLevel;

    @Inject
    @Named(PROPERTY_HEADING_SIZE)
    @Getter
    @Nullable
    private String headingSize;


    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (title == null) {
            Resource page = PageUtil.getResourcePage(resource);
            // get title from page
            if (page.getChild(JcrConstants.JCR_CONTENT) != null) {
                Resource pageContent = page.getChild(JcrConstants.JCR_CONTENT);
                title = pageContent.getValueMap().get(JcrConstants.JCR_TITLE, String.class);
            }
            
            if (StringUtils.isBlank(title)) {
                title = DEFAULT_TITLE;
            }            
        }

        if (headingLevel == null) {
            headingLevel = DEFAULT_HEADING_LEVEL;            
        }

        if (StringUtils.isNotBlank(headingSize)) {
            style.addClasses(headingSize);
        }
   
    }
}
