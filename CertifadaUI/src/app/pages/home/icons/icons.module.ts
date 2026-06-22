import { NgModule } from '@angular/core';

import { FeatherModule } from 'angular-feather';
import {TrendingUp , DollarSign, Compass, Command, Box, Camera, Bell, Monitor, Calendar, Clock,ShoppingCart, Dribbble,Linkedin, Facebook,Instagram, Twitter, Mail, Moon, Sun,} from 'angular-feather/icons';

const icons = {
  TrendingUp , DollarSign, Compass, Command, Box, Camera, Bell, Monitor, Calendar, Clock,ShoppingCart, Dribbble,Linkedin, Facebook, Instagram, Twitter, Mail, Moon, Sun}


@NgModule({
  imports: [
    FeatherModule.pick(icons)
  ],
  exports: [
    FeatherModule
  ]
})
export class IconsModule { }
