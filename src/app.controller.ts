import { Controller, Param, Post, Body, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DefaultGenerics, StreamChat } from 'stream-chat';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

export class SignupBody {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: 'string' })
  wallet: string;
}

@Controller()
export class AppController {
  private serverClient: StreamChat<DefaultGenerics>;

  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {
    console.log('AppController', this.configService.get('STREAMCHAT_KEY'));
    this.serverClient = StreamChat.getInstance(
      this.configService.get('STREAMCHAT_KEY'),
      this.configService.get('STREAMCHAT_SECRET'),
    );
  }

  @Get('/hello')
  hello() {
    return { key: 'hello' };
  }

  @Post('/clean')
  async cleanData() {
    const channels = await this.serverClient.queryChannels(
      { type: 'messaging' },
      [],
      {},
    );
    if (channels.length > 0) {
      await this.serverClient.deleteChannels(
        channels.map((channel) => channel.cid),
      );
    }
    return {
      success: true,
    };
  }

  @Post('/login')
  async login(@Body() body: SignupBody) {
    const result = await this.serverClient.queryUsers({
      id: { $in: [body.wallet] },
    });

    console.log('result.users', result.users);
    if (result.users.length == 0) {
      await this.serverClient.upsertUsers([
        {
          id: body.wallet,
          role: 'user',
        },
      ]);
    }

    const token = this.serverClient.createToken(body.wallet);
    return {
      userId: body.wallet,
      token: token,
    };
  }

  @Post('/match/:id')
  async match(@Param('id') id: string) {
    // in logic
    const inChannels = await this.serverClient.queryChannels(
      { type: 'messaging', members: { $in: [id] } },
      [],
      {},
    );
    for (let i = 0; i < inChannels.length; i++) {
      const channel = inChannels[i];
      if (channel.data.member_count == 1) {
        console.log('in channel');
        return {
          channelId: channel.id,
          memberCount: 1,
        };
      }
    }

    // not in logic
    const ninChannels = await this.serverClient.queryChannels(
      { type: 'messaging', members: { $nin: [id] } },
      [],
      {},
    );

    if (ninChannels.length > 0) {
      for (let i = 0; i < ninChannels.length; i++) {
        const channel = ninChannels[i];
        const count = channel.data.member_count ?? 0;
        // @ts-ignore
        if (count >= 2) {
          continue;
        }
        // maybe matched before, need fix
        console.log('join channel');
        await channel.addMembers([id]);
        return {
          channelId: channel.id,
          memberCount: 2,
        };
      }
    }

    console.log('create and join channel');
    const channelId = uuidv4();
    const channel = this.serverClient.channel('messaging', channelId, {
      members: [id],
    });
    // @ts-ignore
    await channel.create({ data: { created_by_id: channelId } });
    await channel.addMembers([id]);
    return {
      channelId: channel.id,
      memberCount: 1,
    };
  }

  @Post('/chat')
  async chat(@Param('id') id: string) {
    console.log(id);
  }
}
