  import Quill from "quill";
    import { Mention, MentionBlot } from "quill-mention";

    Quill.register({
      "blots/mention": MentionBlot,
      "modules/mention": Mention
    });