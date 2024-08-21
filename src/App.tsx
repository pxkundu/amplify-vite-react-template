import { useEffect, useState } from "react";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { createMap, drawPoints } from 'maplibre-gl-js-amplify';
import 'maplibre-gl/dist/maplibre-gl.css';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import type { Map } from 'maplibre-gl'; // Import Map type

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [map, setMap] = useState<Map | null>(null); // Initialize map state with correct type

  async function initializeMap() {
    const mapInstance = await createMap({
      container: 'map', // An HTML Element or HTML element ID to render the map in
      center: [-123.1187, 49.2819], // [Longitude, Latitude]
      zoom: 11
    });

    mapInstance.on('load', function () {
      drawPoints(
        'mySourceName', // Arbitrary source name
        [
          {
            coordinates: [-122.483696, 37.833818], // [Longitude, Latitude]
            title: 'Golden Gate Bridge',
            address: 'A suspension bridge spanning the Golden Gate'
          },
          {
            coordinates: [-122.477, 37.8105] // [Longitude, Latitude]
          }
        ],
        mapInstance,
        {
          showCluster: true,
          unclusteredOptions: {
            showMarkerPopup: true
          },
          clusterOptions: {
            showCount: true
          }
        }
      );
    });

    setMap(mapInstance); // Store the map instance in state
  }

  useEffect(() => {
    initializeMap();

    const subscription = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });

    return () => {
      if (map) {
        map.remove(); // Clean up the map instance on unmount
      }
      subscription.unsubscribe();
    };
  }, [map]);

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  function createTodo() {
    const content = window.prompt("Todo content");
    if (content) {
      client.models.Todo.create({ content });
    }
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <div id="map"></div>

          <h1>{user?.signInDetails?.loginId}'s todos</h1>
          
          <button onClick={createTodo}>+ new</button>
          <ul>
            {todos.map((todo) => (
              <li 
                onClick={() => deleteTodo(todo.id)}
                key={todo.id}>{todo.content}
              </li>
            ))}
          </ul>
          <div>
            🥳 App successfully hosted. Try creating a new todo.
            <br />
            <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
              Review the next step of this tutorial.
            </a>
          </div>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  );
}

export default App;
