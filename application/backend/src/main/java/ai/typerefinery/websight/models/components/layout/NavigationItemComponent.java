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

import javax.inject.Inject;
import lombok.Getter;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import pl.ds.howlite.components.utils.LinkUtil;

@Model(adaptables = {
  Resource.class,
  SlingHttpServletRequest.class
}, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
  @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true")
})
public class NavigationItemComponent {

  @SlingObject
  private ResourceResolver resourceResolver;

  @Getter
  @Inject
  private String label;

  @Getter
  @Inject
  private String icon;

  @Getter
  @Inject
  private String action;
  
  @Getter
  @Inject
  private String name;

  @Inject
  private String link;

  @Getter
  @Inject
  private Boolean openInNewTab;

  public String getLink() {
    return LinkUtil.handleLink(link, resourceResolver);
  }

  public String getLinkPath() {
    return link;
  }
}
