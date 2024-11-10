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

package ai.typerefinery.websight.models.components.content;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.Collection;
import java.util.LinkedList;
import java.util.stream.Stream;
import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.experimental.Delegate;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.models.components.DefaultStyledGridComponent;
import ai.typerefinery.websight.utils.Grid;
import ai.typerefinery.websight.utils.Styled;
import ai.typerefinery.websight.utils.DefaultImageUtil;
import ai.typerefinery.websight.utils.LinkUtil;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Image extends BaseComponent {

    static final Integer LG_BREAKPOINT_MIN_WIDTH = 970;
    static final Integer MD_BREAKPOINT_MIN_WIDTH = 768;

    @SlingObject
    private ResourceResolver resourceResolver;

    @Inject
    private String smImageSrc;

    @Inject
    private String mdImageSrc;

    @Inject
    private String lgImageSrc;

    @Getter
    @Inject
    private String alt;

    @Getter
    @Inject
    private Boolean showLink;

    @Inject
    private String url;

    @Getter
    @Inject
    @Default(values = "false")
    private String openInNewTab;

    @Getter
    private Collection<ImageSource> imageSources;

    @Getter
    private String defaultImage;

    @Getter
    private long imagesCount;

    @Override
    @PostConstruct
    protected void init() {
        super.init();
        imagesCount = initImagesCount(smImageSrc, mdImageSrc, lgImageSrc);
        defaultImage = initDefaultImage(smImageSrc, mdImageSrc, lgImageSrc, resourceResolver);
        imageSources = initImageSources(smImageSrc, mdImageSrc, lgImageSrc, resourceResolver);
    }

    public static Collection<ImageSource> initImageSources(
        String smImageSrc,
        String mdImageSrc,
        String lgImageSrc,
        ResourceResolver resourceResolver
    ) {
        //only add image sources if they are not empty, do not include smImageSrc as it will be default
        Collection<ImageSource> outputSources = new LinkedList<>();
        if (StringUtils.isNotEmpty(mdImageSrc)) {
            outputSources.add(new ImageSource(LinkUtil.handleLink(lgImageSrc, resourceResolver),
                    LG_BREAKPOINT_MIN_WIDTH));
        }
        if (StringUtils.isNotEmpty(mdImageSrc) && StringUtils.isNotEmpty(smImageSrc)) {
            outputSources.add(new ImageSource(LinkUtil.handleLink(mdImageSrc, resourceResolver),
                    MD_BREAKPOINT_MIN_WIDTH));
        }
        return outputSources;
    }

    public static long initImagesCount(
        String smImageSrc,
        String mdImageSrc,
        String lgImageSrc 
    ) {
        return Stream.of(smImageSrc, mdImageSrc, lgImageSrc)
                .filter(StringUtils::isNotEmpty)
                .count();
    }

    public static String initDefaultImage(
        String smImageSrc,
        String mdImageSrc,
        String lgImageSrc,
        ResourceResolver resourceResolver
    ) {
        return LinkUtil.handleLink(
                DefaultImageUtil.chooseDefaultImage(lgImageSrc, mdImageSrc, smImageSrc),
                resourceResolver);
    }

    public String getUrl() {
        return LinkUtil.handleLink(url, resourceResolver);
    }

    @Getter
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ImageSource {
        public String image;
        public Integer minWidth;
    }
}
