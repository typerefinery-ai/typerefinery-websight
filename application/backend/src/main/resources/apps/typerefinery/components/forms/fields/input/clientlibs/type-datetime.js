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
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Input = Typerefinery.Components.Forms.Input || {};

(function ($, ns) {
    "use strict";

    /**
     * Format a date/time value according to the specified format.
     * @param {string} isoValue - ISO format value (YYYY-MM-DD or YYYY-MM-DDTHH:mm)
     * @param {string} format - Format name (iso-8601, us-date, etc.)
     * @param {string} customFormat - Custom format pattern (if format is "custom")
     * @param {string} inputType - Input type (date, time, datetime-local)
     * @returns {string} Formatted value
     */
    ns.formatDateTime = (isoValue, format, customFormat, inputType) => {
      if (!isoValue) {
        return "";
      }

      let date;
      try {
        // Parse ISO value based on input type
        if (inputType === "date") {
          date = new Date(isoValue + "T00:00:00");
        } else if (inputType === "time") {
          const today = new Date().toISOString().split("T")[0];
          date = new Date(today + "T" + isoValue);
        } else {
          // datetime-local
          date = new Date(isoValue);
        }
      } catch (e) {
        console.error("Error parsing date value:", isoValue, e);
        return isoValue;
      }

      if (isNaN(date.getTime())) {
        return isoValue;
      }

      // Apply format
      if (format === "custom" && customFormat) {
        return ns.formatCustomPattern(date, customFormat);
      }

      switch (format) {
        case "iso-8601":
          return inputType === "date" 
            ? date.toISOString().split("T")[0]
            : inputType === "time"
            ? date.toTimeString().split(" ")[0]
            : date.toISOString().replace("Z", "").split(".")[0];
        
        case "iso-date":
          return date.toISOString().split("T")[0];
        
        case "iso-time":
          return date.toTimeString().split(" ")[0];
        
        case "us-date":
          const usMonth = String(date.getMonth() + 1).padStart(2, "0");
          const usDay = String(date.getDate()).padStart(2, "0");
          const usYear = date.getFullYear();
          return inputType === "date" || inputType === "datetime-local"
            ? `${usMonth}/${usDay}/${usYear}`
            : isoValue;
        
        case "european-date":
          const euDay = String(date.getDate()).padStart(2, "0");
          const euMonth = String(date.getMonth() + 1).padStart(2, "0");
          const euYear = date.getFullYear();
          return inputType === "date" || inputType === "datetime-local"
            ? `${euDay}/${euMonth}/${euYear}`
            : isoValue;
        
        case "long-date":
          const options = { 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          };
          return inputType === "date" || inputType === "datetime-local"
            ? date.toLocaleDateString("en-US", options)
            : isoValue;
        
        case "unix-timestamp":
          return Math.floor(date.getTime() / 1000).toString();
        
        case "rfc-3339":
          return date.toISOString();
        
        case "iso-8601-utc":
          // ISO 8601 with Z (UTC indicator)
          return inputType === "date"
            ? date.toISOString().split("T")[0] + "Z"
            : inputType === "time"
            ? date.toTimeString().split(" ")[0] + "Z"
            : date.toISOString();
        
        case "iso-8601-offset":
          // ISO 8601 with timezone offset (+05:00, -08:00)
          const offset = -date.getTimezoneOffset();
          const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
          const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, "0");
          const offsetSign = offset >= 0 ? "+" : "-";
          const offsetStr = `${offsetSign}${offsetHours}:${offsetMinutes}`;
          
          if (inputType === "date") {
            return date.toISOString().split("T")[0] + offsetStr;
          } else if (inputType === "time") {
            return date.toTimeString().split(" ")[0] + offsetStr;
          } else {
            return date.toISOString().replace("Z", offsetStr).split(".")[0];
          }
        
        default:
          // Default to ISO format
          return inputType === "date"
            ? date.toISOString().split("T")[0]
            : inputType === "time"
            ? date.toTimeString().split(" ")[0]
            : date.toISOString().replace("Z", "").split(".")[0];
      }
    };

    /**
     * Format date using custom pattern.
     * @param {Date} date - Date object
     * @param {string} pattern - Format pattern (e.g., YYYY-MM-DD HH:mm:ss)
     * @returns {string} Formatted value
     */
    ns.formatCustomPattern = (date, pattern) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours24 = String(date.getHours()).padStart(2, "0");
      const hours12 = date.getHours() % 12 || 12;
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      const ampm = date.getHours() >= 12 ? "PM" : "AM";
      
      // Timezone offset calculation
      const offset = -date.getTimezoneOffset();
      const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
      const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, "0");
      const offsetSign = offset >= 0 ? "+" : "-";
      const offsetStr = `${offsetSign}${offsetHours}${offsetMinutes}`; // +0500 format
      const offsetStrColon = `${offsetSign}${offsetHours}:${offsetMinutes}`; // +05:00 format
      
      // Timezone abbreviation and name (using Intl API)
      let timezoneAbbr = "";
      let timezoneName = "";
      try {
        const timeZoneNameFormatter = new Intl.DateTimeFormat("en-US", {
          timeZoneName: "short"
        });
        const parts = timeZoneNameFormatter.formatToParts(date);
        timezoneAbbr = parts.find(p => p.type === "timeZoneName")?.value || "";
        
        const timeZoneLongFormatter = new Intl.DateTimeFormat("en-US", {
          timeZoneName: "long"
        });
        const longParts = timeZoneLongFormatter.formatToParts(date);
        timezoneName = longParts.find(p => p.type === "timeZoneName")?.value || "";
      } catch (e) {
        // Fallback if timezone formatting fails
        console.error("Error formatting timezone:", e);
      }

      // Replace longer patterns first, then single patterns
      // Check original pattern for z/Z context before replacement
      const checkZContext = (offset, str) => {
        // Check if this z/Z is part of zzz, zzzz, or ZZZZ in original pattern
        const before = str.substring(Math.max(0, offset - 3), offset);
        const after = str.substring(offset + 1, Math.min(str.length, offset + 4));
        // Check for zzz, zzzz patterns
        if (before.endsWith("zz") || before.endsWith("zzz") || after.startsWith("zz") || after.startsWith("zzz")) {
          return true; // Part of zzz or zzzz
        }
        // Check for ZZZZ pattern
        if (before.endsWith("ZZZ") || after.startsWith("ZZZ")) {
          return true; // Part of ZZZZ
        }
        return false; // Single z/Z
      };
      
      let result = pattern
        .replace(/YYYY/g, year)
        .replace(/yyyy/g, year) // Java/ICU style
        .replace(/YY/g, String(year).slice(-2))
        .replace(/yy/g, String(year).slice(-2)) // Java/ICU style
        .replace(/MM/g, month)
        .replace(/M/g, String(date.getMonth() + 1))
        .replace(/DD/g, day)
        .replace(/D/g, String(date.getDate()))
        .replace(/HH/g, hours24)
        .replace(/H/g, String(date.getHours()))
        .replace(/hh/g, String(hours12).padStart(2, "0"))
        .replace(/h/g, String(hours12))
        .replace(/mm/g, minutes)
        .replace(/m/g, String(date.getMinutes()))
        .replace(/ss/g, seconds)
        .replace(/s/g, String(date.getSeconds()))
        .replace(/A/g, ampm)
        .replace(/a/g, ampm.toLowerCase())
        // Timezone patterns - replace longer patterns first to avoid conflicts
        // Timezone offset patterns (Linux date command style)
        .replace(/%:z/g, offsetStrColon) // +05:00 format (must be before %z)
        .replace(/%z/g, offsetStr) // +0500 format
        .replace(/zzzz/g, offsetStrColon) // Java/ICU style: +05:00 (must be before zzz)
        .replace(/zzz/g, offsetStr) // Java/ICU style: +0500
        // Timezone name (Java/ICU ZZZZ)
        .replace(/ZZZZ/g, timezoneName) // Pacific Daylight Time, etc.
        // Timezone abbreviation (Linux date %Z)
        .replace(/%Z/g, timezoneAbbr); // PDT, EST, etc.
      
      // Replace single z/Z only if not part of zzz/zzzz/ZZZZ (check original pattern)
      result = result.replace(/z/g, (match, offset) => {
        if (checkZContext(offset, pattern)) {
          return match; // Keep original, was part of longer pattern
        }
        return timezoneAbbr; // Replace single z
      });
      
      result = result.replace(/Z/g, (match, offset) => {
        if (checkZContext(offset, pattern)) {
          return match; // Keep original, was part of longer pattern
        }
        return timezoneAbbr; // Replace single Z
      });
      
      return result;
    };

    /**
     * Convert timezone for a date/time value.
     * @param {string} isoValue - ISO format value
     * @param {string} fromTz - Source timezone (browser-local, utc, or IANA)
     * @param {string} toTz - Target timezone (preserve-input, utc, or IANA)
     * @param {string} inputType - Input type (date, time, datetime-local)
     * @returns {string} Converted ISO value
     */
    ns.convertTimezone = (isoValue, fromTz, toTz, inputType) => {
      if (!isoValue || toTz === "preserve-input") {
        return isoValue;
      }

      try {
        let date;
        
        // Parse based on input type and source timezone
        if (inputType === "date") {
          date = new Date(isoValue + "T00:00:00");
        } else if (inputType === "time") {
          const today = new Date().toISOString().split("T")[0];
          date = new Date(today + "T" + isoValue);
        } else {
          // datetime-local - already includes date and time
          date = new Date(isoValue);
        }

        if (isNaN(date.getTime())) {
          return isoValue;
        }

        // Convert to target timezone
        if (toTz === "utc") {
          // Convert to UTC
          const utcDate = new Date(date.toUTCString());
          if (inputType === "date") {
            return utcDate.toISOString().split("T")[0];
          } else if (inputType === "time") {
            return utcDate.toTimeString().split(" ")[0];
          } else {
            return utcDate.toISOString().replace("Z", "").split(".")[0];
          }
        } else if (toTz && toTz !== "browser-local" && toTz !== "preserve-input") {
          // Convert to specific IANA timezone
          const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: toTz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
          });

          const parts = formatter.formatToParts(date);
          const year = parts.find(p => p.type === "year").value;
          const month = parts.find(p => p.type === "month").value;
          const day = parts.find(p => p.type === "day").value;
          const hour = parts.find(p => p.type === "hour").value;
          const minute = parts.find(p => p.type === "minute").value;
          const second = parts.find(p => p.type === "second").value;

          if (inputType === "date") {
            return `${year}-${month}-${day}`;
          } else if (inputType === "time") {
            return `${hour}:${minute}:${second}`;
          } else {
            return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
          }
        }

        return isoValue;
      } catch (e) {
        console.error("Error converting timezone:", isoValue, fromTz, toTz, e);
        return isoValue;
      }
    };

    /**
     * Normalize a stored date/time string to HTML5 input value format so the browser
     * accepts it (and .val() returns it). Handles e.g. "2024-01-15:14:30:00:+1100" -> "2024-01-15T14:30:00".
     * @param {string} raw - Stored value (may use colon or timezone)
     * @param {string} inputType - "date", "time", or "datetime-local"
     * @returns {string|null} HTML5 format string, or null if not parseable
     */
    ns.normalizeDateTimeForHtml5 = (raw, inputType) => {
      if (!raw || typeof raw !== "string") {
        return null;
      }
      const s = raw.trim();
      if (!s) {
        return null;
      }
      try {
        if (inputType === "date") {
          const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (match) {
            return match[1] + "-" + match[2] + "-" + match[3];
          }
          return null;
        }
        if (inputType === "time") {
          const match = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
          if (match) {
            const h = match[1].padStart(2, "0");
            const m = match[2].padStart(2, "0");
            const sec = match[3] ? match[3].padStart(2, "0") : "00";
            return `${h}:${m}:${sec}`;
          }
          return null;
        }
        if (inputType === "datetime-local") {
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
            return s;
          }
          const colonDateTime = s.match(/^(\d{4})-(\d{2})-(\d{2}):(\d{1,2}):(\d{2})(?::(\d{2}))?/);
          if (colonDateTime) {
            const [, y, mo, d, h, mi, sec] = colonDateTime;
            const ss = (sec && sec.length === 2) ? ":" + sec : ":00";
            return `${y}-${mo}-${d}T${h.padStart(2, "0")}:${mi.padStart(2, "0")}${ss}`;
          }
          const d = new Date(s);
          if (!isNaN(d.getTime())) {
            const pad = (n) => String(n).padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
          }
          return null;
        }
      } catch (e) {
        return null;
      }
      return null;
    };

    /**
     * String prototype: normalize this date/time string to HTML5 input value format.
     * Enables calls like "2024-01-15:14:30:00:+1100".normalizeDateTimeForHtml5("datetime-local").
     * Non-enumerable to avoid breaking for-in over strings.
     */
    if (typeof String.prototype.normalizeDateTimeForHtml5 === "undefined") {
      Object.defineProperty(String.prototype, "normalizeDateTimeForHtml5", {
        value: function (inputType) {
          return ns.normalizeDateTimeForHtml5(String(this), inputType);
        },
        writable: true,
        configurable: true,
        enumerable: false
      });
    }

    /**
     * Initialize datetime formatting for date/time/datetime-local inputs.
     * @param {jQuery} $component - Component element
     * @param {Object} componentConfig - Component configuration from data-model
     */
    ns.initDateTime = ($component, componentConfig) => {
      const fieldId = (componentConfig && componentConfig.id) || "unknown";
      const log = (...args) => console.log("[datetime]", fieldId, ...args);

      // $component is the element with [component="input"] attribute
      // This might be the INPUT element itself (not a wrapper) or a wrapper
      let $nativeInput = $component;
      
      // If $component is not an input, find the input within it
      if (!$component.is('input')) {
        const inputType = componentConfig.inputType;
        $nativeInput = $component.find(`input[type="${inputType}"]`);
        
        if ($nativeInput.length === 0) {
          $nativeInput = $component.find(`input[id="${componentConfig.id}"]`);
        }
        if ($nativeInput.length === 0) {
          $nativeInput = $component.find('input').first();
        }
      }
      
      // If still not found, try finding by component attribute and ID globally
      if ($nativeInput.length === 0 || !$nativeInput.is('input')) {
        $nativeInput = $(`input[component="input"][id="${componentConfig.id}"]`);
      }
      
      if ($nativeInput.length === 0 || !$nativeInput.is('input')) {
        console.error('Datetime input not found for component:', componentConfig.id);
        return;
      }

      // Read all config from componentConfig (from data-model) - REQUIRED by rules
      const inputType = componentConfig.inputType;
      
      // Only initialize for date/time/datetime-local
      if (!["date", "time", "datetime-local"].includes(inputType)) {
        return;
      }

      const format = componentConfig.dateOutputFormat;
      const customFormat = componentConfig.dateCustomFormat;
      const outputTimezone = componentConfig.dateOutputTimezone || "preserve-input";
      const inputTimezone = componentConfig.dateTimezone || "browser-local";

      // Check if format/timezone is configured (if not, use native behavior)
      // Only initialize if format is explicitly set (not default) OR timezone conversion is needed
      const needsFormatting = format && format !== "iso-8601" && format !== "iso-date" && format !== "iso-time";
      const needsTimezoneConversion = outputTimezone && outputTimezone !== "preserve-input";
      
      if (!needsFormatting && !needsTimezoneConversion) {
        // No formatting or timezone conversion needed - use native behavior
        return;
      }

      // Use default format if not specified
      const effectiveFormat = format || (inputType === "date" ? "iso-date" : inputType === "time" ? "iso-time" : "iso-8601");
      
      // CRITICAL: Store format config in data attributes to preserve it across focus/blur cycles
      $nativeInput.data("date-output-format", effectiveFormat);
      $nativeInput.data("date-custom-format", customFormat);
      $nativeInput.data("date-output-timezone", outputTimezone);
      $nativeInput.data("date-input-timezone", inputTimezone);

      // Initialize ISO value - prefer componentConfig.value (from data-model), then DOM value, then data attribute
      // This follows the pattern: read initial value from config, but allow DOM updates for dynamic changes
      // If input has a value, it might be ISO (from picker) or formatted (from previous load) - treat as ISO if it matches ISO pattern
      let initialInputValue = $nativeInput.val();
      let rawConfigValue = componentConfig.value || null;
      // Normalize non-HTML5 datetime strings (e.g. "2024-01-15:14:30:00:+1100") so the browser and formatters get valid ISO
      let isoValue = rawConfigValue ? ns.normalizeDateTimeForHtml5(rawConfigValue, inputType) : null;
      if (!isoValue) {
        isoValue = $nativeInput.data("iso-value") || null;
      }
      if (!isoValue && initialInputValue) {
        // Check if value looks like ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm)
        const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/;
        if (isoPattern.test(initialInputValue)) {
          isoValue = initialInputValue;
        }
      }
      
      if (isoValue) {
        $nativeInput.data("iso-value", isoValue);
      }

      // Create formatted display element - CSS controls visibility (no inline styles)
      let $display = $nativeInput.siblings(".input-datetime-display");
      if ($display.length === 0) {
        $display = $("<span>")
          .addClass("input-datetime-display")
          .addClass("form-control")
          .attr("tabindex", "0")
          .attr("role", "textbox")
          .attr("aria-readonly", "true");
        $nativeInput.after($display);
      }
      $display.removeClass("input-datetime-display--visible").attr("tabindex", "-1");
      
      if (!isoValue) {
        $nativeInput.removeClass("input-datetime-hidden");
        if ($nativeInput.attr("tabindex") === "-1") {
          $nativeInput.removeAttr("tabindex");
        }
        $nativeInput.val("");
      }

      // Format and update native input value and display
      const updateDisplay = () => {
        isoValue = $nativeInput.data("iso-value");
        log("updateDisplay()", "isoValue=", isoValue || "(empty)");
        if (!isoValue) {
          log("updateDisplay()", "path: no value → hide display, show input, clear value");
          $display.removeClass("input-datetime-display--visible").attr("tabindex", "-1");
          $nativeInput.removeClass("input-datetime-hidden");
          if ($nativeInput.attr("tabindex") === "-1") {
            $nativeInput.removeAttr("tabindex");
          }
          $nativeInput.val("");
          $nativeInput.removeData("iso-value");
          $nativeInput.removeData("formatted-value");
          $nativeInput.removeData("html5-value");
          return;
        }

        log("updateDisplay()", "path: has value → format, hide input, show display");

        // CRITICAL: Retrieve format config from data attributes (preserved across focus/blur)
        // This ensures format never changes even if closure variables are lost
        const storedFormat = $nativeInput.data("date-output-format") || effectiveFormat;
        const storedCustomFormat = $nativeInput.data("date-custom-format") || customFormat;
        const storedOutputTimezone = $nativeInput.data("date-output-timezone") || outputTimezone;
        const storedInputTimezone = $nativeInput.data("date-input-timezone") || inputTimezone;

        // Convert timezone if needed
        const convertedValue = ns.convertTimezone(isoValue, storedInputTimezone, storedOutputTimezone, inputType);
        
        // Format the value for display (may be custom e.g. "2024-01-15:14:30:00:+1100")
        const formatted = ns.formatDateTime(convertedValue, storedFormat, storedCustomFormat, inputType);
        
        // Store formatted value as data attribute (for display and blur restore)
        $nativeInput.data("formatted-value", formatted);
        
        // CRITICAL: Input value/attribute MUST be HTML5 format so the browser accepts it and .val() works.
        // The formatted string (e.g. "2024-01-15:14:30:00:+1100") is invalid for datetime-local and causes .val() to return "".
        const html5Value = ns.normalizeDateTimeForHtml5(convertedValue, inputType) || convertedValue;
        $nativeInput.data("html5-value", html5Value);
        $nativeInput.val(html5Value);
        $nativeInput.attr("value", html5Value);
        
        // Update display element with formatted (human-readable) value
        $display.text(formatted);
        
        // Hide input and show display via CSS classes only (no inline styles - avoids border/layout going out of whack)
        $nativeInput.addClass("input-datetime-hidden");
        $nativeInput.attr("tabindex", "-1");
        $display.addClass("input-datetime-display--visible");
        $display.attr("tabindex", "0");
      };

      // On change, store ISO and format
      $nativeInput.on("change", function() {
        const newIsoValue = $nativeInput.val();
        log("change", "newIsoValue=", newIsoValue || "(empty)");
        // Store ISO value from native input (date picker returns ISO)
        if (newIsoValue) {
          $nativeInput.data("iso-value", newIsoValue);
        } else {
          // Clear ISO value if input is empty
          $nativeInput.removeData("iso-value");
        }
        // Always call updateDisplay() to handle both empty and non-empty values
        updateDisplay();
      });

      // On display click, show native input for editing (restore ISO temporarily)
      // Function to show input for editing (used by both click and keyboard)
      const showInputForEditing = function(source) {
        log("showInputForEditing", source || "called", "isoValue(data)=", $nativeInput.data("iso-value") || "(empty)");
        isoValue = $nativeInput.data("iso-value");
        if (isoValue) {
          $nativeInput.val(isoValue);
          $nativeInput.data("baseline-iso-value", isoValue);
          log("showInputForEditing", "set input.val to iso, baseline=", isoValue);
        } else {
          log("showInputForEditing", "no iso value, input.val stays empty");
        }
        $display.removeClass("input-datetime-display--visible").attr("tabindex", "-1");
        if ($nativeInput.attr("tabindex") === "-1") {
          $nativeInput.removeAttr("tabindex");
        }
        $nativeInput.removeClass("input-datetime-hidden").focus();
        log("showInputForEditing", "done: display hidden, input visible and focused");
      };

      // Click handler
      $display.on("click", function() {
        log("display click");
        showInputForEditing("display click");
      });

      // Keyboard handler for tab navigation (Enter/Space to activate)
      $display.on("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          log("display keydown", e.key);
          showInputForEditing("keydown " + e.key);
        }
      });

      // On blur, format again (user finished editing)
      $nativeInput.on("blur", function() {
        const newIsoValue = $nativeInput.val();
        const baselineIsoValue = $nativeInput.data("baseline-iso-value");
        const existingFormatted = $nativeInput.data("formatted-value");

        // Offset/UTC fields: after "restore from cache" we set input.val(existingFormatted). A spurious
        // blur can then run with newIsoValue = that formatted/UTC string, and we'd persist it and shift
        // the value. Treat that as no change and don't persist.
        if ($nativeInput.data("just-restored-from-cache")) {
          $nativeInput.removeData("just-restored-from-cache");
          if (baselineIsoValue && newIsoValue !== baselineIsoValue) {
            log("blur", "path: just-restored, newIsoValue !== baseline → ignore spurious blur, keep canonical");
            $nativeInput.data("iso-value", baselineIsoValue);
            $nativeInput.removeData("baseline-iso-value");
            return;
          }
        }

        // Check if user actually changed the value (compare with baseline set on click)
        const userChangedValue = baselineIsoValue ? (newIsoValue !== baselineIsoValue) : true;

        log("blur", "newIsoValue=", newIsoValue || "(empty)", "baseline=", baselineIsoValue || "(none)", "userChangedValue=", userChangedValue, "existingFormatted=", (existingFormatted ? "yes" : "no"));

        // FIX: When input shows empty on blur but we have a baseline (user just opened edit and didn't change),
        // treat as "no change" and restore from baseline. Prevents repeated clicks from clearing value and
        // leaving only the empty input visible (browsers can report val() empty during blur in some cases).
        if (!newIsoValue && baselineIsoValue) {
          log("blur", "path: input empty but baseline set → treat as no change, restore from baseline");
          $nativeInput.data("iso-value", baselineIsoValue);
          $nativeInput.removeData("baseline-iso-value");
          if (existingFormatted) {
            $nativeInput.val(baselineIsoValue);
            $display.text(existingFormatted);
            $nativeInput.addClass("input-datetime-hidden");
            $nativeInput.attr("tabindex", "-1");
            $display.addClass("input-datetime-display--visible");
            $display.attr("tabindex", "0");
          } else {
            updateDisplay();
          }
          return;
        }

        // Input reports empty but we have stored value and formatted text (focus came via tab/script, not display click).
        // Don't clear - restore display and keep the stored value.
        const storedIsoValue = $nativeInput.data("iso-value");
        if (!newIsoValue && !baselineIsoValue && existingFormatted && storedIsoValue) {
          log("blur", "path: input empty, no baseline, but have stored iso-value and formatted → restore display, keep value");
          $nativeInput.val($nativeInput.data("html5-value") || existingFormatted);
          $display.text(existingFormatted);
          $nativeInput.addClass("input-datetime-hidden");
          $nativeInput.attr("tabindex", "-1");
          $display.addClass("input-datetime-display--visible");
          $display.attr("tabindex", "0");
          return;
        }

        // CRITICAL: Check "no user change" and "nested blur" BEFORE "Always store" / "Clear baseline".
        // Otherwise we clear baseline first; then hiding the input during restore triggers a nested blur
        // that sees baseline=(none) and runs updateDisplay() → clear.

        // OPTIMIZATION: If user didn't change value AND we have cached formatted value, skip reprocessing
        if (!userChangedValue && existingFormatted && newIsoValue) {
          log("blur", "path: no user change → restore display from cache");
          $nativeInput.val($nativeInput.data("html5-value") || existingFormatted);
          $display.text(existingFormatted);
          $nativeInput.data("just-restored-from-cache", true);
          $nativeInput.addClass("input-datetime-hidden");
          $nativeInput.attr("tabindex", "-1");
          $display.addClass("input-datetime-display--visible");
          $display.attr("tabindex", "0");
          return;
        }

        // Nested blur: we just set input.val(existingFormatted) and hid the input; hiding fired blur again.
        if (baselineIsoValue && existingFormatted && newIsoValue === existingFormatted) {
          log("blur", "path: nested blur (val === existingFormatted) → no-op");
          $nativeInput.removeData("baseline-iso-value");
          return;
        }

        // CRITICAL: Only persist iso-value when the user actually changed the value (picker).
        // Never overwrite with our own html5-value or formatted display string, or the value
        // will shift (e.g. convert, persist, next blur convert again → time keeps increasing).
        const storedHtml5 = $nativeInput.data("html5-value");
        const isOurOutput = (storedHtml5 && newIsoValue === storedHtml5) || (existingFormatted && newIsoValue === existingFormatted);
        if (userChangedValue && newIsoValue && !isOurOutput) {
          $nativeInput.data("iso-value", newIsoValue);
        } else if (!newIsoValue) {
          $nativeInput.removeData("iso-value");
        }
        $nativeInput.removeData("baseline-iso-value");

        log("blur", "path: user change or no cache → updateDisplay()");
        updateDisplay();
      });

      // Initialize display if value already exists
      // CRITICAL: Call updateDisplay() to format value and set up display properly
      // This ensures the input has the formatted value set (so .val() works) and visibility is correct
      if (isoValue) {
        log("init", "has value → updateDisplay()");
        // Has value: updateDisplay() will format it, set input value, hide input, show display
        updateDisplay();
      } else {
        log("init", "no value → display hidden, input visible");
        $display.removeClass("input-datetime-display--visible");
        $nativeInput.removeClass("input-datetime-hidden");
        $nativeInput.val("");
        $nativeInput.removeData("iso-value");
        $nativeInput.removeData("formatted-value");
        $nativeInput.removeData("html5-value");
      }

      $nativeInput.on("focus", function() {
        log("input focus", "val=", $nativeInput.val() || "(empty)");
      });
    };

})(jQuery, window.Typerefinery.Components.Forms.Input);
