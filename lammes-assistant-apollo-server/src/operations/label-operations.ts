import {Context} from "../context";
import {AuthenticationError} from "apollo-server";

export interface Label {
  id: number;
  title: string;
}

export async function fetchMyFavoriteLabels(context: Context): Promise<Label[]> {
  const userId = context.jwtPayload?.userId;
  if (!userId) {
    throw new AuthenticationError('You can only resolve notes when you are authenticated.');
  }
  return context.prisma.label.findMany({
    orderBy: {
      title: 'asc'
    }
  });
}
