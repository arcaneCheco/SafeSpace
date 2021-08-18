"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
exports.__esModule = true;
var react_1 = require("react");
var styled_components_1 = require("styled-components");
var ContainerStyled = styled_components_1["default"].div(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n   position: relative;\n   display: inline-block;\n   width: 240px;\n   height: 240px;\n   margin: 5px;\n"], ["\n   position: relative;\n   display: inline-block;\n   width: 240px;\n   height: 240px;\n   margin: 5px;\n"])));
var VideoContainerStyled = styled_components_1["default"].video(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n   width: 240px;\n   height: 240px;\n   background-color: black;\n"], ["\n   width: 240px;\n   height: 240px;\n   background-color: black;\n"])));
var Video = function (_a) {
    var stream = _a.stream, muted = _a.muted;
    var ref = react_1.useRef(null);
    // const [isMuted, setIsMuted] = useState<boolean>(false);
    // const ref = useRef(null);
    var _b = react_1.useState(false), isMuted = _b[0], setIsMuted = _b[1];
    react_1.useEffect(function () {
        if (ref.current)
            ref.current.srcObject = stream;
        if (muted)
            setIsMuted(muted);
    });
    return (react_1["default"].createElement(ContainerStyled, null,
        react_1["default"].createElement(VideoContainerStyled, { ref: ref, muted: isMuted, autoPlay: true })));
};
exports["default"] = Video;
var templateObject_1, templateObject_2;
