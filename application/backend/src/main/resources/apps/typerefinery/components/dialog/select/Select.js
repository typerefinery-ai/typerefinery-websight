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
  render() {
    const {
      options,
      onChange,
      value,
      label,
      testId
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