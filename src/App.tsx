import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'

import { MapView } from "@aws-amplify/ui-react-geo";
import { NavigationControl } from "react-map-gl";

import '@aws-amplify/ui-react-geo/styles.css';

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  const coordinates = {
    longitude: -115.17077150978058,
    latitude: 36.12309017212961,
  };

  
  function deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }
  
  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  return (
        
    <Authenticator>
      {({ signOut, user }) => (
      // {({ signOut }) => (
    <main>
      <div>
        <MapView
          initialViewState={{
            ...coordinates,
            zoom: 15,
          }}
        >
          <NavigationControl position={"top-left"} />
        </MapView>
      </div>
      

      <h1>{user?.signInDetails?.loginId}'s todos</h1>
       {/* <h1>My todos</h1> */}
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li 
          onClick={() => deleteTodo(todo.id)}
          key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
          Review next step of this tutorial.
        </a>
      </div>
      <button onClick={signOut}>Sign out</button>
    </main>
        
      )}
    </Authenticator>
  );
}

export default App;
