import React from "/apps/websight-atlaskit-esm/web-resources/react.js";
import ExportSpaceModal from "/apps/typerefinery/components/actions/spaces/exportspace.modal.js";

class ExportSpaceAction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.execute = this.execute.bind(this);
  }

  execute(space) {
    console.log("space", space);
    this.setState({
      spaceName: space.name,
      spacePath: space.path
    });
    this.modalRef.open(space);
  }


  render() {
    const {
      spaceName,
      spacePath,
      executeCallback
    } = this.props;
    return /*#__PURE__*/React.createElement(ExportSpaceModal, {
      spaceName: spaceName,
      spacePath: spacePath,
      onSuccess: () => executeCallback(),
      ref: element => {
        this.modalRef = element;
      },
      testId: "Modal_ExportSpace"
    });
  }

}

const exportSpace = {
  data: {
    name: "Export Space",
    icon: "upload",
    properties: {
      appearance: "primary"
    }
  },
  actionComponent: ExportSpaceAction
};
export default exportSpace;