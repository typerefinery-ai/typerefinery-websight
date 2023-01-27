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
//namespace
package io.typerefinery.websight.models.components.forms;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Textarea {

  @Inject
  @Getter
  @Default(values = "Textarea")
  private String label;

  @Inject
  @Getter
  @Default(values = "Textarea")
  private String name;

  @Inject
  @Getter
  @Default(values = "textarea")
  private String cls;

  @Inject
  @Getter
  @Default(values = "false")
  private String value;

  @Inject
  @Getter
  @Default(values = "Enter text here..")
  private String placeholder;

  @Inject
  @Getter
  @Default(values = "1")
  private String rows;

  @Inject
  @Getter
  @Default(values = "25")
  private String cols;


}