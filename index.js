import { DynamoDBClient, PutItemCommand, DeleteItemCommand, ScanCommand, GetItemCommand, QueryCommand,UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: 'ap-south-1' });

export const handler = async (event) => {
  const eventBody = JSON.parse(event.body);

  if (event.httpMethod === 'POST') {
    const dynamodbData = marshall(eventBody);
    const params = {
      Item: {
        "userId": { S: "userId_" + Math.random() },
        ...dynamodbData
      },
      TableName: "testing-table-100"
    };

    try {
      const data = await client.send(new PutItemCommand(params));

      const response = {
        statusCode: 200,
        body: JSON.stringify({ data }),
      };
      return response;
    }
    catch (e) {
      const response = {
        statusCode: 500,
        body: JSON.stringify({ error: e.message }),
      };
      return response;
    }
  }
  else if (event.httpMethod === 'DELETE') {
    console.log(event.pathParameters.age);
    try {


      const input = {
        TableName: "testing-table-100",
        Key: {
          "userId": {
            S: event.pathParameters.id
          },
          "Age": {
            S: event.pathParameters.age
          }
        }
      };

      const command = new DeleteItemCommand(input);
      const data = await client.send(command);
      const response = {
        statusCode: 200,
        body: JSON.stringify({ data }),
      };

      return response;
    }
    catch (e) {
      const response = {
        statusCode: 500,
        body: JSON.stringify({ error: e }),
      };

      return response;
    }
  }
  else if (event.httpMethod === "GET") {
    if (event.path === '/all') {
      const input = {
        TableName: "testing-table-100"
      };
      const command = new ScanCommand(input);
      const result = await client.send(command);
      const resultJSON = result.Items.map((item) => {
        return { userId: item.userId.S, age: item.Age.S, height: item.height.N, income: item.income.N };
      });
      const response = {
        statusCode: 200,
        body: JSON.stringify(resultJSON),
      };
      return response;

    }


    else if (event.resource === "/{id}" && event.path) {
      const item = event.pathParameters.id;
      console.log(item);
      const input = {
        "TableName": "testing-table-100",
        Select: "ALL_ATTRIBUTES",
        KeyConditionExpression: "userId = :userIdValue",
        ExpressionAttributeValues: {
          ":userIdValue": { S: item }
        }

      };
      try {
        const command = new QueryCommand(input);
        const result = await client.send(command);
        // const resultJSON = { userId: result.Items.userId.S, Age: result.Items.Age.S, height: result.Items.height.N, income: result.Items.income.N };
        const resultJSON = result.Items.map((item) => {
          return { userId: item.userId.S, Age: item.Age.S, height: item.height.N, income: item.income.N };
        });
        const response = {
          statusCode: 200,
          body: JSON.stringify(resultJSON),
        };
        return response;
      }
      catch (e) {
        const response = {
          statusCode: 500,
          body: JSON.stringify(e),
        };
        return response;
      }
    }
  }
  else if (event.httpMethod === 'PUT' && event.resource === "/{id}/{age}" && event.path) {
    const { id, age } = event.pathParameters;
    const input = {
      TableName: "testing-table-100",
      Key: {
        "userId": { S: id },
        "Age": { S: age }
      },
      UpdateExpression: "SET #H = :h, #I = :i",
      ExpressionAttributeNames: {
        "#H": "height",
        "#I": "income"
      },
      ExpressionAttributeValues: {
        ":h": { N: eventBody.height.toString() },
        ":i": { N: eventBody.income.toString() }
      },
      ReturnValues: "ALL_NEW"
    };

    try {
      const command = new UpdateItemCommand(input);
      const data = await client.send(command);
      const response = {
        statusCode: 200,
        body: JSON.stringify({ message:"Updated Successfully",data: unmarshall(data.Attributes) }),
      };
      return response;
    } catch (e) {
      const response = {
        statusCode: 500,
        body: JSON.stringify({ error: e.message }),
      };
      return response;
    }
  }

};
