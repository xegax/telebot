module Telegram {
    export interface Result<T> {
        ok: boolean;
        result: T[];
        error_code?: number;
        description?: string;
    }
    
    export interface Result2<T> {
        ok: boolean;
        result: T;
        error_code?: number;
        description?: string;
    }

    export module Bot {
        export interface User {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
        }
        
        export interface GroupChat {
            id: number;
            title: string;
        }
        
        export interface Update {
            update_id: number;
            message: Message;
        }
        
        export interface Message {
            message_id: number;
            from: User;
            date: number;
            chat: User | GroupChat;
            forward_from?: User;
            text?: string;
            photo?: PhotoSize[];
            new_chat_participant?: User;
            left_chat_participant?: User;
            group_chat_created?: boolean;
        }
        
        export interface SendMessage {
            chat_id: number;
            text: string;
            parse_mode?: string;
            disable_web_page_preview?: number;
            reply_to_message_id?: number;
            reply_markup?: any;
        }
        
        export interface ReplyKeyboardMarkup {
          keyboard: string[];
          resize_keyboard?: boolean;
          one_time_keyboard?: boolean;
          selective?: boolean;
        }
        
        export interface SendPhoto {
            chat_id: number;
            photo: any;
            caption?: string;
            reply_to_message_id?: number;
            reply_markup?: number;
        }
        
        export interface PhotoSize {
            file_id: string;
            file_size: number;
            width: number;
            height: number;
        }
    }
}