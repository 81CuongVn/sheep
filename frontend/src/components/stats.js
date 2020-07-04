import React, {Component} from 'react';
import axios from 'axios';

class Stats extends Component {
	constructor(props) {
		super(props);
		this.state = {stats: undefined};
	}

	async componentDidMount() {
		var stats = await axios('/api/info');
		stats = stats.data;
		console.log(stats);
		this.setState({stats: stats});
	}

	render() {
		var stats = this.state.stats;
		if(stats!=undefined) {
			return (
				<div className="App-commandsContainer">
		          <h2>Stats</h2>
		          <div className="App-command">
			          <div>
			          	<h3>Guilds: {stats.guilds}</h3>
			          </div>
			          <div>
			          	<h3>Users: {stats.users}</h3>
			          </div>
		          </div>
		        </div>
			);
		} else {
			return (
				<div className="App-commandsContainer">
		          <h2>Stats</h2>
		          <div className="App-command">
			          <div>
			          	<h3>Guilds: Loading...</h3>
			          </div>
			          <div>
			          	<h3>Users: Loading...</h3>
			          </div>
		          </div>
		        </div>
			);
		}
	}
}

export default Stats;