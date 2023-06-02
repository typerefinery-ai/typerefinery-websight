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

package ai.typerefinery.websight.models.components.widgets;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.osgi.service.component.annotations.Component;

import ai.typerefinery.websight.models.components.KeyValuePair;

@Component
@Model(adaptables = Resource.class, resourceType = {
        "typerefinery/components/widgets/ticker" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class WidgetOptionItem extends KeyValuePair {

    public WidgetOptionItem() {
    }
    
    public WidgetOptionItem(String key, String value) {
        this.key = key;
        this.value = value;
    }
}
