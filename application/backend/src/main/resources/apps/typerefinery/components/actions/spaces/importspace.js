import React from "/apps/websight-atlaskit-esm/web-resources/react.js";
import ImportSpaceModal from "/apps/typerefinery/components/actions/spaces/importspace.modal.js";

class ImportSpaceAction extends React.Component {
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
    return /*#__PURE__*/React.createElement(ImportSpaceModal, {
      spaceName: spaceName,
      spacePath: spacePath,
      onSuccess: () => executeCallback(),
      ref: element => {
        this.modalRef = element;
      },
      testId: "Modal_ImportSpace"
    });
  }

}

const importSpace = {
  data: {
    name: "Import Space",
    icon: "download",
    properties: {
      appearance: "primary"
    }
  },
  actionComponent: ImportSpaceAction
};
export default importSpace;