---
layout: page
title: Mostly empty categories
comments: false
---

Article categories in no particular order. They should be pretty self explanatory except when you don't get them. 

{% capture site_cats %}{% for cat in site.categories %}{{ cat | first }}{% unless forloop.last %},{% endunless %}{% endfor %}{% endcapture %}
{% assign categories = site_cats | split:',' | sort %}

<div id="tags">
  <ul class="tag-box inline">
  {% for item in (0..site.categories.size) %}{% unless forloop.last %}
    {% capture this_word %}{{ categories[item] | strip_newlines }}{% endcapture %}
    <li><a href="#{{ this_word | cgi_escape }}">{{ this_word }}<span>{{ site.categories[this_word].size }}</span></a></li>
  {% endunless %}{% endfor %}
  </ul>
 
  {% for item in (0..site.categories.size) %}{% unless forloop.last %}
    {% capture this_word %}{{ categories[item] | strip_newlines }}{% endcapture %}
  <h2 id="{{ this_word | cgi_escape }}">{{ this_word }}</h2>
  <ul class="posts">
    {% for post in site.categories[this_word] %}{% if post.title != null %}
    <li itemscope><span class="entry-date"><time datetime="{{ post.date | date_to_xmlschema }}" itemprop="datePublished">{{ post.date | date: "%B %d, %Y" }}</time></span> &raquo; <a href="{{ post.url }}">{{ post.title }}</a></li>
    {% endif %}{% endfor %}
  </ul>
  {% endunless %}{% endfor %}
</div>