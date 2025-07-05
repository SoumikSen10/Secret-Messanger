import mongoose from "mongoose";

type ConnectionObject = {
    isConnected?: number
}

const connection: ConnectionObject = {};

async function dbConnect() : Promise<void>
{
   if(connection.isConnected)
   {
     console.log("Already connected to the database");
     return;
   }

   try
   {
      const db = await mongoose.connect(process.env.MONGO_URI || "", {/*options*/});

     connection.isConnected = db.connections[0].readyState; //checking db connection is ready or not

     console.log("DB connected successfully");
   }
   catch(error)
   {
     console.log("Database connection failed", error);
     process.exit(1); //exit the process if connection fails
   }
}

export default dbConnect;