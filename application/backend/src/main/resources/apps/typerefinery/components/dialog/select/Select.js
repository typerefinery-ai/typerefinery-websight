function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
import AtlaskitSelect from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/select.js";
import React from "/apps/websight-atlaskit-esm/web-resources/react.js";
class Select extends React.Component {
  constructor(props) {
    super(props);
    const {
      options
    } = this.props;

    let defaultOption = this.findDefaultOption(options);
    this.state = {
      defaultOption: defaultOption,
      // isLoading: false,
      options: options,
      // initValue: value
    };
  }
  // componentDidUpdate(prevProps) {
  //   console.log(["componentDidUpdate", prevProps])
  //   const {
  //     options,
  //     defaultOption,
  //     initValue
  //   } = this.state;
  //   if (prevProps.options !== options) {
  //     this.setState({
  //       defaultOption: this.findDefaultOption(options)
  //     });
  //   }
  // }
  findOption(value) {
    //find the option value in the options of the select
    const {
      options,
      defaultOption
    } = this.state;

    var returnOption = '';
    var optionsList = options;
    var hasGroups = false;

    var notFound = true;

    optionsList.forEach(option => {
      //check if this is a group
      if (option["options"]) {
        hasGroups = true;
        var foundSubOption = false;
        option["options"].forEach(subOption => {
          if (subOption.value === value) {
            returnOption = subOption;
            foundSubOption = true;
            notFound = false;
            return returnOption;
          }
        })
        if (foundSubOption) {
          return returnOption;
        }
      } else {
        if (option.value === value) {
          returnOption = option;
          notFound = false;
          return returnOption;
        }
      }
    });

    return returnOption;

  }
  //go thought all options and find last selected option
  findDefaultOption(options) {
    var returnOption = '';

    options.forEach(option => {
      //check if this is a group
      if (option["options"]) {
        this.setState({
          hasGroups: true
        });
        option["options"].forEach(subOption => {
          if (subOption.selected) {
            returnOption = subOption;
            return subOption;
          }
        })
      } else {
        if (option.selected) {
          returnOption = option;
        }
      }
    });

    return returnOption;
  }
  createOption(label) {
    console.log(["createOption", label])
    return {
      label,
      value: label ? label.toLowerCase().replace(/\W/g, '') : ''
    }
  };
  isLoading() {
    const {
      isLoading
    } = this.state;
    return isLoading;
  }
  handleChange(newValue) {
    console.group('Value Changed');
    console.log(newValue);
    console.groupEnd();
    this.setState({ value: newValue });
  };
  handleCreate(inputValue) {
    const {
      options,
      allowCreate
    } = this.state;

    this.setState({ isLoading: true });
    console.group('Option created');

    console.log(["creating new option", allowCreate, inputValue]);

    const newOption = this.createOption(inputValue);
    this.setState({
      isLoading: false,
      options: [...options, newOption],
      value: newOption,
    });
    return newOption;
  }
  /**
   * Generic method to load CSS file dynamically
   * @param {string} cssUrl - URL of the CSS file to load
   * @param {string} linkId - Unique ID for the link element (optional, auto-generated from URL if not provided)
   * @returns {boolean} - Returns true if CSS was loaded (or already exists), false if failed
   */
  loadCSS(cssUrl, linkId) {
    if (!cssUrl) {
      return false;
    }
    
    // Generate ID from URL if not provided
    if (!linkId) {
      linkId = 'css-dynamic-' + cssUrl.replace(/[^a-zA-Z0-9]/g, '-');
    }
    
    // Check if CSS is already loaded
    const isCSSLoaded = () => {
      // Check if link element exists
      const existingLink = document.getElementById(linkId);
      if (existingLink) {
        return true;
      }
      
      // Check if any link with this href exists
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      for (let i = 0; i < links.length; i++) {
        if (links[i].href && links[i].href.includes(cssUrl)) {
          return true;
        }
      }
      
      return false;
    };
    
    // Load CSS if not already loaded
    if (!isCSSLoaded()) {
      try {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = cssUrl;
        link.crossOrigin = 'anonymous';
        
        // Handle both document and iframe contexts (for dialogs)
        const targetDocument = document;
        const targetHead = targetDocument.head || targetDocument.getElementsByTagName('head')[0];
        
        if (targetHead) {
          targetHead.appendChild(link);
          console.log('CSS loaded dynamically:', cssUrl);
          return true;
        } else {
          console.warn('Could not find head element to load CSS:', cssUrl);
          return false;
        }
      } catch (error) {
        console.error('Error loading CSS:', cssUrl, error);
        return false;
      }
    }
    
    return true;
  }
  /**
   * Ensure required CSS files are loaded based on component props
   */
  ensureRequiredCSS() {
    const {
      isIcon
    } = this.props;
    
    // Load clientlibs-editor.css (contains Font Awesome and other editor styles)
    if (isIcon) {
      this.loadCSS('/etc.clientlibs/typerefinery/components/clientlibs/clientlibs-editor.css', 'clientlibs-editor-css');
    }
  }
  componentDidMount() {
    this.ensureRequiredCSS();
  }
  formatOptionLabel(option, { context }) {
    const {
      isColour,
      isIcon
    } = this.props;

    // Handle grouped options (they don't have value/label directly)
    if (option.options) {
      return option.label || '';
    }

    const optionValue = option.value || '';
    const optionLabel = option.label || '';

    // For selected value display (smaller size)
    const isValueContext = context === 'value';
    const swatchSize = isValueContext ? '16px' : '20px';
    const iconSize = isValueContext ? '14px' : '16px';

    // Render color swatch if isColour is true and value is a valid color
    if (isColour && optionValue) {
      // Check if value looks like a hex color or is empty (default)
      const isValidColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(optionValue) || optionValue === '';
      if (isValidColor) {
        return /*#__PURE__*/React.createElement("div", {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            width: swatchSize,
            height: swatchSize,
            backgroundColor: optionValue || 'transparent',
            border: optionValue ? '1px solid #ccc' : '1px solid #999',
            borderRadius: '3px',
            flexShrink: 0
          }
        }), /*#__PURE__*/React.createElement("span", null, optionLabel));
      }
    }

    // Render icon if isIcon is true and value contains icon classes
    if (isIcon && optionValue) {
      // Check if value looks like a Font Awesome class
      const isIconClass = /^(fa|fab|far|fas|fal|fad)\s+fa-/.test(optionValue) || /^fa\s+fa-/.test(optionValue);
      if (isIconClass) {
        return /*#__PURE__*/React.createElement("div", {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        }, /*#__PURE__*/React.createElement("i", {
          className: optionValue,
          style: {
            fontSize: iconSize,
            width: iconSize,
            textAlign: 'center',
            flexShrink: 0
          }
        }), /*#__PURE__*/React.createElement("span", null, optionLabel));
      }
    }

    // Default rendering - just the label
    return optionLabel;
  }
  render() {
    const {
      options,
      onChange,
      value,
      label,
      testId,
      isColour,
      isIcon
    } = this.props;
    const {
      defaultOption
    } = this.state;
    return /*#__PURE__*/React.createElement(AtlaskitSelect
    // eslint-disable-next-line react/jsx-props-no-spreading
    , _extends({}, this.props, {
      classNamePrefix: testId,
      onChange: ev => {
        console.log(["onChange", ev]);
        // this.handleChange(ev);
        onChange(ev.value);
      },
      onCreateOption: ev => {
        console.log(["onCreateOption", ev]);
        this.handleCreate(ev);
      },
      options: options,
      value: this.findOption(value) ?? defaultOption ?? '',
      placeholder: label,
      defaultValue: defaultOption,
      menuPortalTarget: document.body,
      formatOptionLabel: this.formatOptionLabel.bind(this),
      styles: {
        menuPortal: base => ({
          ...base,
          zIndex: 9999
        })
      }
    }));
  }
}
export default Select;