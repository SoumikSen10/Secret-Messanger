import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
  await dbConnect();

  try {

     const {username, email, password} = await request.json();  

     const existingUserVerifiedByUsername = await UserModel.findOne({
        username : username,
        isVerified : true,
     })

     if(existingUserVerifiedByUsername)
     {
        return Response.json({
            success : false,
            message : "Username is already taken",
        },{status : 400});
     }

     const existingUserByEmail = await UserModel.findOne({email});
     const verifyCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit verification code

     if(existingUserByEmail)
     {
        // If user exists with the same email, check if they are verified
        if(existingUserByEmail.isVerified)
        {
            // If user is already verified, return an error
            return Response.json({
                success : false,
                message : "User already exists with this email",
            },{status : 400});
        }
        else
        {
            // Update existing user with new password and verification code
            const hashedPassword = await bcrypt.hash(password, 10);

            existingUserByEmail.password = hashedPassword;
            existingUserByEmail.verifyCode = verifyCode;
           existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);

            await existingUserByEmail.save();
        }
     }
     else
     {
        // Create a new user if no existing user found
       const hashedPassword = await bcrypt.hash(password,10);
       const expiryDate = new Date();
       expiryDate.setHours(expiryDate.getHours() + 1); // Set expiry date to 1 hour from now

       const newUser = new UserModel({
            username,
            email,
            password: hashedPassword,
            verifyCode,
            verifyCodeExpiry : expiryDate,
            isVerified: false,
            isAcceptingMessage : true,
            messages : [],
       })

       await newUser.save();
     }

     // send verification email
     const emailResponse = await sendVerificationEmail(
        email, 
        username,
        verifyCode
     );

     if(!emailResponse.success)
     {
        return Response.json({
            success : false,
            message : emailResponse.message,
        },{status : 500});
     }

     return Response.json({
            success : true,
            message : "User registered successfully. Please check your email for verification.",
        },{status : 201})

  } catch (error) {
    console.log("Error registering user : ", error);
    return Response.json(
      {
        success: false,
        message: "Error registering user",
      },
      { status: 500 }
    );
  }
}
