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
//namespace
package ai.typerefinery.websight.models.components.list;
import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.utils.LinkUtil;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import javax.jcr.Node;

import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class ListItem extends BaseComponent {
    
    @ValueMapValue
    private String title;
 
    @ValueMapValue
    private String url;

    @ValueMapValue
    private String hreflang;

    @ValueMapValue
    private String text;

    @ValueMapValue
    private String ping;

    @ValueMapValue
    private String referrerpolicy;

    @ValueMapValue
    private boolean target;

    @ValueMapValue
    private String mediaType; //media/MIME type

    public String getTitle() {
        return title;
    }
    public String getUrl() {
        return url;
    }
    public String getHreflang() {
        return hreflang;
    }
    public String getText() {
        return text;
    }
    public String getPing() {
        return ping;
    }
    public String getReferrerpolicy() {
        return referrerpolicy;
    }
    public boolean getTarget() {
        return target;
    }
    public String getMediaType() {
        return mediaType;
    }

    public void setTitle(String title) {
        this.title = title;
    }
    public void setUrl(String url) {
        this.url = url;
    }
    public void setHreflang(String hreflang) {
        this.hreflang = hreflang;
    }
    public void setText(String text) {
        this.text = text;
    }
    public void setPing(String ping) {
        this.ping = ping;
    }
    public void setReferrerpolicy(String referrerpolicy) {
        this.referrerpolicy = referrerpolicy;
    }
    public void setTarget(boolean target) {
        this.target = target;
    }
    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }


}