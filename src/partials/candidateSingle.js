import React from 'react';
import {
  withRouter
} from "react-router-dom";
import * as waxjs from "@waxio/waxjs/dist";

import '../App.css';
import { submitVote } from '../middleware.js';

// const wax = new waxjs.WaxJS('https://testnet.waxsweden.org', null, null, false);
const WAX_RPC_URL = 'https://wax.greymass.com'
const wax = new waxjs.WaxJS(WAX_RPC_URL, null, null, false);

class CandidateSingle extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      nominee: '',
      picture: '',
      description: '',
      website: '',
      telegram: '',
      twitter: '',
      wechat: '',
      votes: '0 VOTE',
      ballot: ''
    }
    this.UnvoteCandidate = this.UnvoteCandidate.bind(this);
    this.VoteCandidate = this.VoteCandidate.bind(this);
    }

  componentDidMount = async () => {
    const owner = this.props.match.params.owner;
    //for some reason these props arent preserved on direct link to candidate
    let ballot = '';
    if (!this.props.ballot) {
      let resp = await wax.rpc.get_table_rows({             
        limit: 1,
        code: 'oig',
        scope: 'oig',
        table: 'election',
        json: true
      });
      ballot = resp.rows[0].ballot;
    } else {
      ballot = this.props.ballot;
    }
    this.setState({ballot: ballot})
    this.fetchData(owner);
  }

  async fetchData(owner) {
     try {
      let resp = await wax.rpc.get_table_rows({             
            code: 'oig',
            scope: 'oig',
            table: 'nominees',
            limit: 1,
            lower_bound: owner,
            upper_bound: owner,
            json: true
        });
  
      let voteCounts = await wax.rpc.get_table_rows({
            code: 'decide',
            scope: 'decide',
            table: 'ballots',
            limit: 1,
            lower_bound: this.state.ballot,
            upper_bound: this.state.ballot,
            json: true
          });
      let voteCount = '0 VOTE';
      if (this.props.electionState === 4 && Array.isArray(voteCounts.rows) && voteCounts.rows.length !== 0) {
        console.log(voteCounts.rows[0].options);
        voteCount = voteCounts.rows[0].options.find(obj => obj.key === resp.rows[0].owner).value;
      }    
      this.setState({
        nominee: resp.rows[0].owner,
        name: resp.rows[0].name,
        picture: resp.rows[0].picture,
        description: resp.rows[0].descriptor,
        telegram: resp.rows[0].telegram,
        twitter: resp.rows[0].twitter,
        wechat: resp.rows[0].wechat,
        votes: voteCount
      });
    } catch(e) {
      console.log(e);
    }       // ...
  };

  async UnvoteCandidate(){

  }

  async VoteCandidate() {
    await submitVote(this.props.activeUser, this.state.ballot, this.state.nominee);
  }

  render() {
    return (
      <div className="candidate-single">
        <div className="candidate-header">
          <h2>{this.state.name}</h2>
          <span><i>Candidate for WAX OIG</i></span><br />
          <span className="vote-count"><i>{this.state.votes}S</i></span>
        </div>
        <div className="candidate-left-pane">
          <img src={this.state.picture} alt={this.state.nominee} />
        </div>
        <div className="candidate-right-pane">
          <p className="description">{this.state.description}</p>
          { this.state.twitter || this.state.telegram || this.state.wechat ?
            <>
              <strong>Social Media</strong>
            </>
            :
            <>
            </>
          }
          <ul>
            { this.state.telegram ? 
              <>
                <li>Telegram: {this.state.telegram}</li>
              </>
              :
              <>
              </>
            }
            { this.state.twitter ? 
              <>
                <li><a href={this.state.twitter} target="_blank" rel="noopener noreferrer" >Twitter</a></li>
              </>
            :
            <>
            </>
            }
            { this.state.wechat ? 
              <>
                <li>WeChat: {this.state.wechat}</li>
              </>
            :
            <>
            </>
            }
          </ul>
          { this.props.electionState === 4 && this.props.activeUser ?
            <>
              <button onClick={this.VoteCandidate} className="btn" id="castvote">Vote for {this.state.name}</button>
            </>
            :
            <>
            </>
          }
          </div>
      </div>
    );
  }
}

export default withRouter(CandidateSingle);
