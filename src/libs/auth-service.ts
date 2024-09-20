import { signUp as amplifySignUp, signIn as amplifySignIn, confirmSignUp, getCurrentUser, signOut } from "aws-amplify/auth";

export const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
  await amplifySignUp({
    username: email,
    password,
    options: {
      userAttributes: {
        name: name
      },
    }
  }).catch(()=> {
    console.log("signing up failed");
    return false;
  });
  return true;
}

export const confirmEmail = async (email: string, confirmationCode: string) => {
  const { isSignUpComplete} = await confirmSignUp({
    username: email,
    confirmationCode
  });
  if (isSignUpComplete){
    console.log("Confirm sign up is a success");
  }
}

export const signIn = async (email: string, password: string): Promise<boolean> => {
  const {isSignedIn} = await amplifySignIn({
    username: email,
    password: password,
  })
  if (isSignedIn){
    console.log("Sign in is a success");
  }
  return isSignedIn;
}

export const isSigningInNecessary = async (): Promise<boolean> => {
  try {
    const { username, userId, signInDetails } = await getCurrentUser();
    console.log("You are already signed in");
    console.log(username, userId, signInDetails);
    return true;
  } catch(error: unknown){
    console.log("You are not authenticated");
    return false;
  }
}

export const logOut = async () => {
  await signOut();
  return;
}