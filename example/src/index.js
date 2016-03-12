import React, { Component } from 'react';
import { render } from 'react-dom';

const lang = (window.navigator.userLanguage || window.navigator.language || 'en').split(/[-_]+/)[0];

class LangProvider extends Component {
  static childContextTypes = {
    langs: React.PropTypes.object,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      langs: require('languages'),
    };

    if (module.hot) {
      module.hot.accept('languages', function() {
        this.setState({
          langs: require('languages'),
        });
      }.bind(this));
    }
  }

  getChildContext() {
    return {
      langs: this.state.langs,
    }
  }

  render() {
    return React.Children.only(this.props.children);
  }
}

class Hello extends Component {
  static contextTypes = {
    langs: React.PropTypes.object,
  };

  render() {
    const l = this.context.langs[lang] || this.context.langs.en;
    return <h1>{l['messages.hello']}</h1>
  }
}

class App extends Component {
  render() {
    return (
      <LangProvider>
        <Hello />
      </LangProvider>
    );
  }
}

render(<App />, document.getElementById('root'));
