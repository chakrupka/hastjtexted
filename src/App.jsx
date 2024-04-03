import { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [didHeSend, setDidHeSend] = useState(false);
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingLast, setLoadingLast] = useState(true);
  const [lastMessage, setLastMessage] = useState(null);

  const api_token = import.meta.env.VITE_ACCESS_TOKEN;
  const group_id = import.meta.env.VITE_GROUP_ID;
  const sender_id = import.meta.env.VITE_SENDER_ID;
  const url = `https://api.groupme.com/v3/groups`;

  const getMostRecent = async () => {
    const res = await axios.get(
      `${url}/${group_id}/messages?token=${api_token}&limit=1`
    );
    const data = res.data;
    return data.response.messages[0];
  };

  const getPrev100 = async ({ last_id }) => {
    const res = await axios.get(
      `${url}/${group_id}/messages?token=${api_token}&limit=100&before_id=${last_id}`
    );
    const data = res.data;
    return data.response.messages;
  };

  const getTodayMessages = async ({ most_recent }) => {
    let todays_messages = [];
    let prev_100 = await getPrev100({ last_id: most_recent });
    todays_messages = todays_messages.concat(prev_100);

    let date = new Date();
    date.setUTCHours(4, 0, 0, 0);

    while (todays_messages[todays_messages.length - 1].created_at > date) {
      console.log("went here");
      let next_100 = await getPrev100({
        last_id: todays_messages[todays_messages.length - 1].id,
      });
      todays_messages = todays_messages.concat(next_100);
    }

    return todays_messages;
  };

  const lastMessageSent = async () => {
    let most_recent = await getMostRecent();
    let found_message = false;

    if (most_recent.sender_id === `${sender_id}`) {
      setLastMessage(most_recent);
    } else {
      let current_100 = await getPrev100({ last_id: most_recent.id });

      while (!found_message || current_100.length < 1) {
        for (let msg in current_100) {
          console.log(current_100[msg]);

          if (current_100[msg].sender_id === `${sender_id}`) {
            setLastMessage(current_100[msg]);
            console.log("broke");
            found_message = true;
            break;
          }
        }
        current_100 = await getPrev100({
          last_id: current_100[current_100.length - 1].id,
        });
      }
    }
    setLoadingLast(false);
  };

  const didHeSendToday = async () => {
    let most_recent = await getMostRecent();

    if (most_recent.sender_id === `${sender_id}`) {
      setDidHeSend(true);
    } else {
      const todays_messages = await getTodayMessages({
        most_recent: most_recent.id,
      });
      for (let msg in todays_messages) {
        if (todays_messages[msg].sender_id === `${sender_id}`) {
          setDidHeSend(true);
          break;
        }
      }
    }
    setLoadingToday(false);
  };

  const getDate = ({ unix_time }) => {
    const date = new Date(unix_time * 1000);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    console.log(formattedTime);
    return formattedTime;
  };

  useEffect(() => {
    didHeSendToday();
    lastMessageSent();
  }, []);

  return (
    <div className='main'>
      <p className='title'>Did TJ Text in the GroupMe Today?</p>
      {loadingToday ? (
        <p className='loading-today'>Checking today...</p>
      ) : (
        <p className='didhesend'>{didHeSend ? "YES!" : "NOPE!"}</p>
      )}
      {loadingLast ? (
        <p className='loading-last'>Loading last message...</p>
      ) : (
        <div className='last-message'>
          <p>
            Last message was on {getDate({ unix_time: lastMessage.created_at })}
          </p>
          <p>The message: "{lastMessage.text}"</p>
        </div>
      )}
    </div>
  );
};

export default App;
