import React from 'react';
import { findDOMNode } from 'react-dom';
import { getVisibleSelectionRect } from 'draft-js';

const DEFAULT_TOOLBAR_HEIGHT = 44;

const getRelativeParent = (element) => {
  if (!element) {
    return null;
  }

  const position = window.getComputedStyle(element).getPropertyValue('position');
  if (position !== 'static') {
    return element;
  }

  return getRelativeParent(element.parentElement);
};

const DefaultToolbarComponent = ({ position, theme, children }) => {
  const style = position.open ?
      { top: position.top,
        left: position.left,
        transform: 'translate(-50%) scale(1)',
        transition: 'transform 0.15s cubic-bezier(.3,1.2,.2,1)',
      } : {
        transform: 'translate(-50%) scale(0)'
      };
    return <div className={theme.toolbarStyles.toolbar}
                style={style}>
      {children}
    </div>;
};

export default class Toolbar extends React.Component {

  state = {
    isVisible: false,
    position: { open: false },
  }

  componentWillMount() {
    this.props.store.subscribeToItem('isVisible', this.onVisibilityChanged);
  }

  componentWillUnmount() {
    this.props.store.unsubscribeFromItem('isVisible', this.onVisibilityChanged);
  }

  onVisibilityChanged = (isVisible) => {
    // need to wait a tick for window.getSelection() to be accurate
    // when focusing editor with already present selection
    const { toolbarHeight = DEFAULT_TOOLBAR_HEIGHT } = this.props;
    setTimeout(() => {
      let position;
      if (isVisible) {
        const toolbar = findDOMNode(this.toolbar);
        const relativeParent = getRelativeParent(toolbar.parentElement);
        const relativeRect = relativeParent ? relativeParent.getBoundingClientRect() : document.body.getBoundingClientRect();
        const selectionRect = getVisibleSelectionRect(window);
        position = {
          top: (selectionRect.top - relativeRect.top) - toolbarHeight,
          left: (selectionRect.left - relativeRect.left) + (selectionRect.width / 2),
          open: true,
        };
      } else {
        position = { open: false };
      }
      this.setState({ position });
    }, 0);
  }

  render() {
    const {
      theme,
      store,
      toolbarComponent = <DefaultToolbarComponent /> } = this.props;
    return React.cloneElement(
      toolbarComponent,
      {
        ref: (toolbar) => { this.toolbar = toolbar; },
        position: this.state.position,
        theme,
      },
      this.props.structure.map((Component, index) => (
        <Component
          key={index}
          theme={theme.buttonStyles}
          getEditorState={store.getItem('getEditorState')}
          setEditorState={store.getItem('setEditorState')}
        />
      ))
    );
  }
}
