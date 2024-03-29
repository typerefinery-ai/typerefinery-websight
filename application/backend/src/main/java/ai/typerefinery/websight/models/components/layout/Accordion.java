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
package ai.typerefinery.websight.models.components.layout;
import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import javax.inject.Inject;
import org.apache.sling.models.annotations.Default;
import lombok.Getter;
@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Accordion {
  private String label;
  
 @Inject
 @Getter
 @Default(values = "Accordion Item ")
 private String title;

 @Inject
 @Getter
 @Default(values = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.")
 private String content;
}