function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
import AtlaskitSelect from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/select.js";
import React from "/apps/websight-atlaskit-esm/web-resources/react.js";
class Select extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      defaultOption: this.findDefaultOption()
    };
  }
  componentDidUpdate(prevProps) {
    const {
      options
    } = this.props;
    if (prevProps.options !== options) {
      this.setState({
        defaultOption: this.findDefaultOption()
      });
    }
  }
  findOption(value) {
    const {
      options
    } = this.props;
    return options.find(option => option.value === value);
  }
  findDefaultOption() {
    const {
      options
    } = this.props;
    return options.find(option => option.selected);
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
        onChange(ev.value);
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